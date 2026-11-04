import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { DEFAULT_BRANCH_COLOR, addNode } from '../store/treeReducer'
import { findPath } from '../store/treeUtils'
import { useTree } from '../store/useTree'
import type { SkillNode } from '../types/skillTree'
import { EditableText } from './EditableText'
import { LevelPicker } from './LevelPicker'
import { LinkEditor } from './LinkEditor'

const KIND_LABEL = ['Stamme', 'Hovedgren'] as const
const HEX_COLOR = /^#[0-9a-f]{6}$/i

type SidePanelProps = {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

/**
 * Panel i højre side til at redigere den valgte node. Findes noden ikke
 * (intet valgt, eller den er lige slettet), vises panelet ikke.
 */
export function SidePanel({ selectedId, onSelect }: SidePanelProps) {
  const { tree } = useTree()
  // Id på en node, der lige er tilføjet. Dens navnefelt får fokus,
  // så man kan omdøbe den med det samme.
  const [justAddedId, setJustAddedId] = useState<string | null>(null)

  const path = selectedId ? findPath(tree.root, selectedId) : undefined
  if (!path) return null

  const node = path[path.length - 1]

  function handleAdd(id: string) {
    setJustAddedId(id)
    onSelect(id)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') onSelect(null)
  }

  return (
    <aside
      className="side-panel"
      aria-label="Redigér node"
      onKeyDown={handleKeyDown}
    >
      {/* key: et nyt NodeEditor-objekt pr. node, så kladder i felterne
          ikke hænger ved, når man skifter til en anden node. */}
      <NodeEditor
        key={node.id}
        node={node}
        path={path}
        autoFocusName={justAddedId === node.id}
        onAdd={handleAdd}
        onClose={() => onSelect(null)}
      />
    </aside>
  )
}

type NodeEditorProps = {
  node: SkillNode
  path: SkillNode[]
  autoFocusName: boolean
  onAdd: (id: string) => void
  onClose: () => void
}

function NodeEditor({
  node,
  path,
  autoFocusName,
  onAdd,
  onClose,
}: NodeEditorProps) {
  const { dispatch } = useTree()
  const depth = path.length - 1
  const isRoot = depth === 0
  const isBranch = depth === 1
  // Undergrene arver hovedgrenens farve; hovedgrenen er nummer 2 på vejen.
  const branchColor = path[1]?.color ?? DEFAULT_BRANCH_COLOR
  const id = node.id

  function handleAddChild() {
    const action = addNode(id, isRoot ? 'Ny gren' : 'Ny færdighed')
    dispatch(action)
    onAdd(action.id)
  }

  return (
    <>
      <header className="side-panel-header">
        <span className="side-panel-kind">
          {KIND_LABEL[depth] ?? 'Færdighed'}
        </span>
        <button
          type="button"
          className="small-button"
          aria-label="Luk panel"
          onClick={onClose}
        >
          ✕
        </button>
      </header>

      <EditableText
        label="Navn"
        value={node.name}
        required
        autoFocus={autoFocusName}
        onCommit={(name) => dispatch({ type: 'renameNode', id, name })}
      />

      <EditableText
        label="Beskrivelse"
        value={node.description ?? ''}
        multiline
        onCommit={(description) =>
          dispatch({ type: 'setDescription', id, description })
        }
      />

      {depth >= 2 && (
        <LevelPicker
          level={node.level ?? 0}
          color={branchColor}
          onChange={(level) => dispatch({ type: 'setLevel', id, level })}
        />
      )}

      {isBranch && (
        <div className="field">
          <label htmlFor="branch-color" className="field-label">
            Farve
          </label>
          <input
            id="branch-color"
            type="color"
            className="color-input"
            // Farvevælgeren kræver #rrggbb; andre formater (fx fra en
            // importeret fil) vises med standardfarven.
            value={
              node.color && HEX_COLOR.test(node.color)
                ? node.color
                : DEFAULT_BRANCH_COLOR
            }
            onChange={(event) =>
              dispatch({ type: 'setColor', id, color: event.target.value })
            }
          />
        </div>
      )}

      <EditableText
        label="Noter"
        value={node.notes ?? ''}
        multiline
        onCommit={(notes) => dispatch({ type: 'setNotes', id, notes })}
      />

      <LinkEditor
        links={node.links ?? []}
        onAdd={(title, url) => dispatch({ type: 'addLink', id, title, url })}
        onRemove={(index) => dispatch({ type: 'removeLink', id, index })}
      />

      <div className="side-panel-actions">
        <button
          type="button"
          className="action-button"
          onClick={handleAddChild}
        >
          {isRoot ? 'Tilføj hovedgren' : 'Tilføj undernode'}
        </button>
        {!isRoot && (
          <DeleteButton
            onDelete={() => {
              dispatch({ type: 'deleteNode', id })
              onClose()
            }}
          />
        )}
      </div>
    </>
  )
}

/**
 * Slet i to trin: første klik spørger, andet klik sletter. Flytter man
 * fokus væk fra knappen, fortrydes spørgsmålet.
 */
function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <button
      type="button"
      className={`action-button danger${confirming ? ' confirming' : ''}`}
      onClick={() => (confirming ? onDelete() : setConfirming(true))}
      onBlur={() => setConfirming(false)}
    >
      {confirming ? 'Er du sikker?' : 'Slet'}
    </button>
  )
}
