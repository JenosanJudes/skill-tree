import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { DEFAULT_BRANCH_COLOR, addNode } from '../store/treeReducer'
import { findPath, isHexColor } from '../store/treeUtils'
import { useTree } from '../store/useTree'
import type { Level, SkillNode } from '../types/skillTree'
import { EditableText } from './EditableText'
import { vibrate } from './haptics'
import { LevelPicker } from './LevelPicker'
import { LinkEditor } from './LinkEditor'
import { NodeSummary } from './NodeSummary'
import { MOBILE_QUERY, useMediaQuery } from './useMediaQuery'

const KIND_LABEL = ['Stamme', 'Hovedgren'] as const

/** Stiger niveauet? Så giver telefonen et lille ryk. */
function isLevelUp(node: SkillNode, level: Level): boolean {
  return level > (node.level ?? 0)
}

type SidePanelProps = {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

/**
 * Panel til den valgte node. På en bred skærm står det i højre side og kan
 * redigere med det samme. På en telefon er det et ark i bunden: først en kort
 * læsevisning, og "Redigér" folder hele formularen ud. Findes noden ikke
 * (intet valgt, eller den er lige slettet), vises panelet ikke.
 */
export function SidePanel({ selectedId, onSelect }: SidePanelProps) {
  const { tree } = useTree()
  // Id på en node, der lige er tilføjet. Dens navnefelt får fokus,
  // så man kan omdøbe den med det samme.
  const [justAddedId, setJustAddedId] = useState<string | null>(null)
  const isMobile = useMediaQuery(MOBILE_QUERY)
  // Id på den node, arket er foldet ud for. Vi gemmer id'et og ikke bare
  // sandt/falsk, så arket folder sig sammen igen, når man vælger en anden.
  const [editingId, setEditingId] = useState<string | null>(null)

  const path = selectedId ? findPath(tree.root, selectedId) : undefined
  if (!path) return null

  const node = path[path.length - 1]
  // En node, man lige har tilføjet, åbner i redigering, så den kan få navn.
  const editing = !isMobile || editingId === node.id || justAddedId === node.id

  function handleAdd(id: string) {
    setJustAddedId(id)
    onSelect(id)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') onSelect(null)
  }

  return (
    <aside
      className={`side-panel${isMobile ? ' sheet' : ''}${editing ? '' : ' peek'}`}
      aria-label="Redigér node"
      onKeyDown={handleKeyDown}
    >
      {/* key: et nyt NodeEditor-objekt pr. node, så kladder i felterne
          ikke hænger ved, når man skifter til en anden node. */}
      {editing ? (
        <NodeEditor
          key={node.id}
          node={node}
          path={path}
          autoFocusName={justAddedId === node.id}
          onAdd={handleAdd}
          onClose={() => onSelect(null)}
          // Kun på telefon: tilbage til den korte visning.
          onDone={
            isMobile
              ? () => {
                  setEditingId(null)
                  setJustAddedId(null)
                }
              : undefined
          }
        />
      ) : (
        <NodePeek
          key={node.id}
          node={node}
          path={path}
          onEdit={() => setEditingId(node.id)}
          onClose={() => onSelect(null)}
        />
      )}
    </aside>
  )
}

type NodePeekProps = {
  node: SkillNode
  path: SkillNode[]
  onEdit: () => void
  onClose: () => void
}

/**
 * Den korte visning i bundarket. Niveauet kan sættes direkte herfra, fordi
 * det er det, man oftest ændrer; alt andet ligger bag "Redigér".
 */
function NodePeek({ node, path, onEdit, onClose }: NodePeekProps) {
  const { dispatch } = useTree()
  const depth = path.length - 1
  const branchColor = path[1]?.color ?? DEFAULT_BRANCH_COLOR

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
      <div className="sheet-summary">
        <NodeSummary node={node} />
      </div>
      {depth >= 2 && (
        <LevelPicker
          level={node.level ?? 0}
          color={branchColor}
          onChange={(level) => {
            if (isLevelUp(node, level)) vibrate()
            dispatch({ type: 'setLevel', id: node.id, level })
          }}
        />
      )}
      <button type="button" className="action-button" onClick={onEdit}>
        Redigér
      </button>
    </>
  )
}

type NodeEditorProps = {
  node: SkillNode
  path: SkillNode[]
  autoFocusName: boolean
  onAdd: (id: string) => void
  onClose: () => void
  /** Vises som knappen "Færdig", når den er sat (bundarket på telefon). */
  onDone?: () => void
}

function NodeEditor({
  node,
  path,
  autoFocusName,
  onAdd,
  onClose,
  onDone,
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
        <span className="side-panel-header-buttons">
          {onDone && (
            <button type="button" className="small-button" onClick={onDone}>
              Færdig
            </button>
          )}
          <button
            type="button"
            className="small-button"
            aria-label="Luk panel"
            onClick={onClose}
          >
            ✕
          </button>
        </span>
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
          onChange={(level) => {
            if (isLevelUp(node, level)) vibrate()
            dispatch({ type: 'setLevel', id, level })
          }}
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
              node.color && isHexColor(node.color)
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
