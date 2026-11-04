import { useMemo, useRef } from 'react'
import { computeLayout } from '../layout/computeLayout'
import { useTree } from '../store/useTree'
import { TreeBackground } from './TreeBackground'
import { TreeDrawing } from './TreeDrawing'
import { useZoom } from './useZoom'

type SkillTreeViewProps = {
  selectedId: string | null
  /** Kaldes med nodens id ved klik på en node og med null ved klik ved siden af. */
  onSelect: (id: string | null) => void
}

/** Hele træet som én SVG med zoom og panorering. */
export function SkillTreeView({ selectedId, onSelect }: SkillTreeViewProps) {
  const { tree } = useTree()
  const svgRef = useRef<SVGSVGElement>(null)

  // Regnes kun om, når selve træet er ændret.
  const layout = useMemo(() => computeLayout(tree.root), [tree.root])
  const { x, y, width, height } = layout.bounds
  const { transform, resetZoom } = useZoom(svgRef, layout.bounds)

  return (
    <div className="tree-wrapper">
      {/* role="group" og ikke "img": et billede må ikke indeholde knapper,
          så skærmlæsere ville skjule noderne. d3-zoom sluger selv klikket
          efter et træk, så panorering lukker ikke panelet. */}
      <svg
        ref={svgRef}
        className="tree-view"
        viewBox={`${x} ${y} ${width} ${height}`}
        role="group"
        aria-label="Skill tree"
        onClick={() => onSelect(null)}
      >
        <TreeBackground transform={transform.toString()} />
        <g transform={transform.toString()}>
          <TreeDrawing
            layout={layout}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </g>
      </svg>
      <button type="button" className="reset-zoom" onClick={resetZoom}>
        Vis alt
      </button>
    </div>
  )
}
