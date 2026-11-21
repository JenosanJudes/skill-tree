import { useCallback, useMemo, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { branchBounds, computeLayout } from '../layout/computeLayout'
import { cameraToFit, withoutCovered } from '../layout/viewport'
import type { Covered } from '../layout/viewport'
import { useTree } from '../store/useTree'
import { HoverCard } from './HoverCard'
import { StarField } from './StarField'
import { TreeDrawing } from './TreeDrawing'
import { useHoverCard } from './useHoverCard'
import { useViewport } from './useViewport'
import { MIN_SCALE, useZoom } from './useZoom'

type SkillTreeViewProps = {
  selectedId: string | null
  /** Kaldes med nodens id ved klik på en node og med null ved klik ved siden af. */
  onSelect: (id: string | null) => void
  /** Flere knapper, der vises ved siden af "Vis alt" (fx værktøjslinjen). */
  controls?: ReactNode
  /** Adresse til et eget baggrundsbillede. Uden den er baggrunden en stjernehimmel. */
  backgroundUrl?: string | null
  /**
   * Den del af skærmen, panelet dækker, når en node er valgt. Kameraet
   * flyver uden om den. Skal være det samme objekt fra gang til gang.
   */
  covered?: Covered
}

/** Slør over baggrundsbilledet, så noder og navne kan læses. */
const BACKGROUND_SHADE = 'linear-gradient(rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.55))'

const NOTHING_COVERED: Covered = { right: 0, bottom: 0 }

/** Så tæt flyver kameraet højst på en gren, også hvis den er meget lille. */
const MAX_FLY_SCALE = 2.5

/**
 * Under denne skala (skærm-pixels pr. SVG-enhed) er der zoomet så langt ud,
 * at undergrenenes navne skjules. Så ligner træet et stjernekort, og kun
 * stamme og hovedgrene har navn.
 */
const DETAIL_SCALE = 0.7

/** Hele træet som én SVG med zoom, panorering og hover-boks. */
export function SkillTreeView({
  selectedId,
  onSelect,
  controls,
  backgroundUrl,
  covered = NOTHING_COVERED,
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
  const { transform, resetZoom, flyTo } = useZoom(svgRef, layout.bounds, hide)
  const viewport = useViewport(svgRef, layout.bounds)
  // Hvor mange skærm-pixels én SVG-enhed fylder lige nu.
  const screenScale = viewport.fitScale * transform.k

  // useCallback, fordi TreeDrawing er memo og skal have samme funktion hver
  // gang. Et tryk på en hovedgren vælger den og flyver kameraet ind på den.
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id)
      const node = layout.nodes.find((n) => n.id === id)
      if (!node?.branchId) return
      // En hovedgren flyver kameraet altid ind på. En undergren gør det kun,
      // når der er zoomet så langt ud, at navnene er skjult. Det læses fra
      // SVG'en og ikke fra state, så funktionen ikke skifter ved hvert zoom.
      const zoomedOut = svgRef.current?.dataset.detail === 'far'
      if (node.kind !== 'branch' && !zoomedOut) return
      const target = branchBounds(layout, node.branchId)
      if (target) {
        // Valget åbner panelet, så grenen skal stå i den frie del.
        const free = withoutCovered(viewport, covered)
        flyTo(cameraToFit(target, free, MIN_SCALE, MAX_FLY_SCALE))
      }
    },
    [onSelect, layout, viewport, covered, flyTo],
  )

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
      {/* Knapperne står før SVG'en i HTML'en, fordi Tab følger rækkefølgen
          i HTML'en. Ellers skulle man Tabbe gennem hele træet først.
          På skærmen står de øverst til venstre (position: absolute). */}
      <div className="controls">
        <button type="button" className="reset-zoom" onClick={resetZoom}>
          Vis alt
        </button>
        {controls}
      </div>
      {/* Stjernehimlen vises kun, når der ikke er et billede. Den ligger bag
          SVG'en og flytter sig lidt med kameraet. */}
      {!backgroundUrl && (
        <StarField
          panX={transform.x * viewport.fitScale}
          panY={transform.y * viewport.fitScale}
        />
      )}
      {/* role="group" og ikke "img": et billede må ikke indeholde knapper,
          så skærmlæsere ville skjule noderne. d3-zoom sluger selv klikket
          efter et træk, så panorering lukker ikke panelet. */}
      <svg
        ref={svgRef}
        className="tree-view"
        viewBox={`${x} ${y} ${width} ${height}`}
        role="group"
        aria-label="Skill tree"
        data-detail={screenScale < DETAIL_SCALE ? 'far' : 'near'}
        // En CSS-variabel, som index.css bruger til at holde navne og
        // trykflader store nok, når der er zoomet ud.
        style={{ '--screen-scale': screenScale } as CSSProperties}
        onClick={() => onSelect(null)}
      >
        <g transform={transform.toString()}>
          <TreeDrawing
            layout={layout}
            selectedId={selectedId}
            onSelect={handleSelect}
            onHoverStart={show}
            onHoverEnd={hide}
          />
        </g>
      </svg>
      {/* Ingen boks på den valgte node; sidepanelet viser det samme. */}
      {hovered && hovered.id !== selectedId && (
        <HoverCard nodeId={hovered.id} position={hovered.position} />
      )}
    </div>
  )
}
