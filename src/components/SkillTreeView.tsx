import { useMemo } from 'react'
import { computeLayout } from '../layout/computeLayout'
import { useTree } from '../store/useTree'
import { TreeEdge } from './TreeEdge'
import { TreeNode } from './TreeNode'

/** Hele træet som én SVG. Layoutet regnes af d3; React tegner kun resultatet. */
export function SkillTreeView() {
  const { tree } = useTree()

  // Regnes kun om, når selve træet er ændret.
  const layout = useMemo(() => computeLayout(tree.root), [tree.root])
  const { x, y, width, height } = layout.bounds

  return (
    <svg
      className="tree-view"
      viewBox={`${x} ${y} ${width} ${height}`}
      role="img"
      aria-label="Skill tree"
    >
      {/* Forbindelser først, så noderne tegnes oven på dem. */}
      {layout.links.map((link) => (
        <TreeEdge key={link.id} link={link} />
      ))}
      {layout.nodes.map((node) => (
        <TreeNode key={node.id} node={node} />
      ))}
    </svg>
  )
}
