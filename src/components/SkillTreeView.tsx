import { useMemo, useRef } from 'react'
import { computeLayout } from '../layout/computeLayout'
import { useTree } from '../store/useTree'
import { TreeBackground } from './TreeBackground'
import { TreeDrawing } from './TreeDrawing'
import { useZoom } from './useZoom'

/** Hele træet som én SVG med zoom og panorering. */
export function SkillTreeView() {
  const { tree } = useTree()
  const svgRef = useRef<SVGSVGElement>(null)

  // Regnes kun om, når selve træet er ændret.
  const layout = useMemo(() => computeLayout(tree.root), [tree.root])
  const { x, y, width, height } = layout.bounds
  const { transform, resetZoom } = useZoom(svgRef, layout.bounds)

  return (
    <div className="tree-wrapper">
      <svg
        ref={svgRef}
        className="tree-view"
        viewBox={`${x} ${y} ${width} ${height}`}
        role="img"
        aria-label="Skill tree"
      >
        <TreeBackground transform={transform.toString()} />
        <g transform={transform.toString()}>
          <TreeDrawing layout={layout} />
        </g>
      </svg>
      <button type="button" className="reset-zoom" onClick={resetZoom}>
        Vis alt
      </button>
    </div>
  )
}
