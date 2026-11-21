import type { CSSProperties } from 'react'
import type { CardPosition } from '../layout/hoverCardPosition'
import { DEFAULT_BRANCH_COLOR } from '../store/treeReducer'
import { findPath } from '../store/treeUtils'
import { useTree } from '../store/useTree'
import { NodeSummary } from './NodeSummary'

type HoverCardProps = {
  nodeId: string
  position: CardPosition
}

/**
 * Lille boks med info om en node, kun til læsning. Den er almindelig HTML
 * oven på SVG'en, så teksten har samme størrelse uanset zoom.
 */
export function HoverCard({ nodeId, position }: HoverCardProps) {
  const { tree } = useTree()
  const path = findPath(tree.root, nodeId)
  if (!path) return null

  const node = path[path.length - 1]
  const isSkill = path.length > 2
  const branchColor = path[1]?.color ?? DEFAULT_BRANCH_COLOR

  const style: CSSProperties = {
    left: position.left,
    top: position.y,
  }

  return (
    <div
      className={`hover-card ${position.placement}`}
      role="tooltip"
      style={style}
    >
      <NodeSummary node={node} levelColor={isSkill ? branchColor : undefined} />
    </div>
  )
}
