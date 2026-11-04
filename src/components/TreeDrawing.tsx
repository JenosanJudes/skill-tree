import { memo } from 'react'
import type { Layout } from '../layout/computeLayout'
import { TreeEdge } from './TreeEdge'
import { TreeNode } from './TreeNode'

type TreeDrawingProps = {
  layout: Layout
}

/**
 * Forbindelser og noder. memo gør, at den kun tegnes igen, når layoutet
 * ændres, og ikke ved hvert hjul-tick under zoom (kun <g>'s transform ændres).
 */
export const TreeDrawing = memo(function TreeDrawing({
  layout,
}: TreeDrawingProps) {
  return (
    <>
      {/* Forbindelser først, så noderne tegnes oven på dem. */}
      {layout.links.map((link) => (
        <TreeEdge key={link.id} link={link} />
      ))}
      {layout.nodes.map((node) => (
        <TreeNode key={node.id} node={node} />
      ))}
    </>
  )
})
