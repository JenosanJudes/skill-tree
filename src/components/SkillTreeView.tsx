import { useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { computeLayout } from '../layout/computeLayout'
import { useTree } from '../store/useTree'
import { HoverCard } from './HoverCard'
import { TreeBackground } from './TreeBackground'
import { TreeDrawing } from './TreeDrawing'
import { useHoverCard } from './useHoverCard'
import { useZoom } from './useZoom'

type SkillTreeViewProps = {
  selectedId: string | null
  /** Kaldes med nodens id ved klik på en node og med null ved klik ved siden af. */
  onSelect: (id: string | null) => void
  /** Flere knapper, der vises ved siden af "Vis alt" (fx værktøjslinjen). */
  controls?: ReactNode
  /** Adresse til et eget baggrundsbillede. Uden den er baggrunden sort med prikker. */
  backgroundUrl?: string | null
}

/** Slør over baggrundsbilledet, så noder og navne kan læses. */
const BACKGROUND_SHADE = 'linear-gradient(rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.55))'

/** Hele træet som én SVG med zoom, panorering og hover-boks. */
export function SkillTreeView({
  selectedId,
  onSelect,
  controls,
  backgroundUrl,
}: SkillTreeViewProps) {
  const { tree } = useTree()
  const svgRef = useRef<SVGSVGElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Regnes kun om, når selve træet er ændret.
  const layout = useMemo(() => computeLayout(tree.root), [tree.root])
  const { x, y, width, height } = layout.bounds
  const { hovered, show, hide } = useHoverCard(wrapperRef)
  // Boksen skjules, når en zoom eller et træk begynder, så den ikke står
  // et forkert sted, mens træet flytter sig.
  const { transform, resetZoom } = useZoom(svgRef, layout.bounds, hide)

  return (
    <div
      className={backgroundUrl ? 'tree-wrapper has-image' : 'tree-wrapper'}
      ref={wrapperRef}
      // Billedet ligger på wrapperen og ikke i SVG'en, så det står stille,
      // mens træet zoomes. Sløret er en ensfarvet "gradient" oven på billedet.
      style={
        backgroundUrl
          ? { backgroundImage: `${BACKGROUND_SHADE}, url("${backgroundUrl}")` }
          : undefined
      }
    >
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
        {/* Prikkerne vises kun, når der ikke er et billede. */}
        {!backgroundUrl && <TreeBackground transform={transform.toString()} />}
        <g transform={transform.toString()}>
          <TreeDrawing
            layout={layout}
            selectedId={selectedId}
            onSelect={onSelect}
            onHoverStart={show}
            onHoverEnd={hide}
          />
        </g>
      </svg>
      {/* Ingen boks på den valgte node; sidepanelet viser det samme. */}
      {hovered && hovered.id !== selectedId && (
        <HoverCard nodeId={hovered.id} position={hovered.position} />
      )}
      <div className="controls">
        <button type="button" className="reset-zoom" onClick={resetZoom}>
          Vis alt
        </button>
        {controls}
      </div>
    </div>
  )
}
