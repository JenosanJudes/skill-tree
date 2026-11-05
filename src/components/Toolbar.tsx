import { useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { ALLOWED_TYPES, checkBackgroundFile } from '../store/backgroundStorage'
import { downloadTree, parseImport } from '../store/fileTransfer'
import { countNodes } from '../store/treeUtils'
import { useTree } from '../store/useTree'
import type { SkillTree } from '../types/skillTree'

/** Så mange fejl vises højst; resten opsummeres. */
const MAX_ERRORS = 5

// Hvilken lille boks der er åben under knapperne. Én ad gangen.
type Popover =
  | { kind: 'none' }
  | { kind: 'export' }
  | { kind: 'confirm'; tree: SkillTree; fileName: string }
  | { kind: 'error'; errors: string[]; fileName: string }
  | { kind: 'background'; error?: string }

type ToolbarProps = {
  /** Kaldes, når et importeret træ har erstattet det gamle. */
  onImported: () => void
  hasBackground: boolean
  /** Gemmer og viser et nyt baggrundsbillede. Kaster en fejl, hvis det mislykkes. */
  onBackgroundChosen: (file: File) => Promise<void>
  onBackgroundRemoved: () => Promise<void>
}

/** Knapperne "Eksportér", "Importér" og "Baggrund" med deres små bokse. */
export function Toolbar({
  onImported,
  hasBackground,
  onBackgroundChosen,
  onBackgroundRemoved,
}: ToolbarProps) {
  const { tree, dispatch } = useTree()
  const [popover, setPopover] = useState<Popover>({ kind: 'none' })
  const fileInput = useRef<HTMLInputElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)

  const close = () => setPopover({ kind: 'none' })

  /** Åbner boksen, eller lukker den, hvis den allerede er åben. */
  function toggle(kind: 'export' | 'background') {
    setPopover(popover.kind === kind ? { kind: 'none' } : { kind })
  }

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const error = checkBackgroundFile(file)
    if (error) {
      setPopover({ kind: 'background', error })
      return
    }
    try {
      await onBackgroundChosen(file)
      close()
    } catch {
      setPopover({
        kind: 'background',
        error: 'Billedet kunne ikke gemmes i browseren.',
      })
    }
  }

  async function handleRemoveImage() {
    await onBackgroundRemoved()
    close()
  }

  function handleExport(includeNotes: boolean) {
    downloadTree(tree, includeNotes)
    close()
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Nulstil feltet, så man kan vælge den samme fil igen bagefter.
    event.target.value = ''
    if (!file) return

    const result = parseImport(await file.text())
    setPopover(
      result.ok
        ? { kind: 'confirm', tree: result.tree, fileName: file.name }
        : { kind: 'error', errors: result.errors, fileName: file.name },
    )
  }

  function handleReplace(newTree: SkillTree) {
    dispatch({ type: 'replaceTree', tree: newTree })
    close()
    onImported()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') close()
  }

  return (
    <div className="toolbar" onKeyDown={handleKeyDown}>
      <div className="toolbar-buttons">
        <button
          type="button"
          className="toolbar-button"
          aria-expanded={popover.kind === 'export'}
          onClick={() => toggle('export')}
        >
          Eksportér
        </button>
        <button
          type="button"
          className="toolbar-button"
          // Filvælgeren er skjult; knappen "klikker" på den for os.
          onClick={() => fileInput.current?.click()}
        >
          Importér
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          aria-label="Vælg JSON-fil"
          hidden
          onChange={handleFile}
        />
        <button
          type="button"
          className="toolbar-button"
          aria-expanded={popover.kind === 'background'}
          onClick={() => toggle('background')}
        >
          Baggrund
        </button>
        <input
          ref={imageInput}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          aria-label="Vælg baggrundsbillede"
          hidden
          onChange={handleImage}
        />
      </div>

      {popover.kind === 'background' && (
        <div className="popover" role="dialog" aria-label="Baggrund">
          <p>
            {hasBackground
              ? 'Du bruger dit eget billede som baggrund.'
              : 'Baggrunden er sort. Vælg et billede for at bruge dit eget.'}
          </p>
          {popover.error && (
            <p className="field-error" role="alert">
              {popover.error}
            </p>
          )}
          <div className="popover-actions">
            <button
              type="button"
              className="action-button"
              onClick={() => imageInput.current?.click()}
            >
              Vælg billede
            </button>
            {hasBackground && (
              <button
                type="button"
                className="action-button"
                onClick={handleRemoveImage}
              >
                Fjern billede
              </button>
            )}
            <button type="button" className="small-button" onClick={close}>
              Luk
            </button>
          </div>
        </div>
      )}

      {popover.kind === 'export' && (
        <div className="popover" role="dialog" aria-label="Eksportér træet">
          <p>Skal noter og links med i filen?</p>
          <div className="popover-actions">
            <button
              type="button"
              className="action-button"
              onClick={() => handleExport(true)}
            >
              Med noter
            </button>
            <button
              type="button"
              className="action-button"
              onClick={() => handleExport(false)}
            >
              Uden noter
            </button>
            <button type="button" className="small-button" onClick={close}>
              Annullér
            </button>
          </div>
        </div>
      )}

      {popover.kind === 'confirm' && (
        <div className="popover" role="dialog" aria-label="Bekræft import">
          <p>
            Erstat det nuværende træ med{' '}
            <strong>{popover.tree.root.name}</strong> (
            {countNodes(popover.tree.root)} noder) fra {popover.fileName}?
          </p>
          <p className="popover-hint">
            Det nuværende træ kan ikke hentes tilbage. Eksportér det først, hvis
            du vil beholde det.
          </p>
          <div className="popover-actions">
            <button
              type="button"
              className="action-button danger confirming"
              onClick={() => handleReplace(popover.tree)}
            >
              Erstat
            </button>
            <button type="button" className="small-button" onClick={close}>
              Annullér
            </button>
          </div>
        </div>
      )}

      {popover.kind === 'error' && (
        <div className="popover" role="alert">
          <p>
            {popover.fileName} kunne ikke importeres. Dit træ er ikke ændret.
          </p>
          <ul className="popover-errors">
            {popover.errors.slice(0, MAX_ERRORS).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          {popover.errors.length > MAX_ERRORS && (
            <p className="popover-hint">
              og {popover.errors.length - MAX_ERRORS} fejl mere.
            </p>
          )}
          <div className="popover-actions">
            <button type="button" className="small-button" onClick={close}>
              Luk
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
