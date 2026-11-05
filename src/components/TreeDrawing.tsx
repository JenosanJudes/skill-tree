import { memo } from 'react'
import type { Layout } from '../layout/computeLayout'
import { GLOW_BLUR, GLOW_FILTER_ID } from '../layout/glow'
import { TreeEdge } from './TreeEdge'
import { TreeNode } from './TreeNode'

type TreeDrawingProps = {
  layout: Layout
  selectedId: string | null
  onSelect: (id: string) => void
  onHoverStart: (id: string, element: Element) => void
  onHoverEnd: () => void
}

/**
 * Forbindelser og noder. memo gør, at den kun tegnes igen, når layoutet eller
 * den valgte node ændres, og ikke ved hvert hjul-tick under zoom (kun <g>'s
 * transform ændres). Derfor skal funktionerne være de samme hver gang.
 */
export const TreeDrawing = memo(function TreeDrawing({
  layout,
  selectedId,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: TreeDrawingProps) {
  return (
    <>
      <defs>
        {/* Slører det, der bruger filteret. Området er gjort 3 gange så stort
            som figuren (x/y -100 %, bredde/højde 300 %), ellers ville
            sløringen blive klippet af ved kanten. */}
        <filter
          id={GLOW_FILTER_ID}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation={GLOW_BLUR} />
        </filter>
      </defs>
      {/* Forbindelser først, så noderne tegnes oven på dem. */}
      {layout.links.map((link) => (
        <TreeEdge key={link.id} link={link} />
      ))}
      {layout.nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          selected={node.id === selectedId}
          onSelect={onSelect}
          onHoverStart={onHoverStart}
          onHoverEnd={onHoverEnd}
        />
      ))}
    </>
  )
})
