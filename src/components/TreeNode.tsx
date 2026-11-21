import { useState } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent, SVGProps } from 'react'
import { NODE_RADIUS } from '../layout/computeLayout'
import type { LayoutNode } from '../layout/computeLayout'
import { GLOW_FILTER_ID, glowFor } from '../layout/glow'
import { levelSegments } from '../layout/levelRing'
import { wrapLabel } from '../layout/wrapLabel'

const ROOT_COLOR = '#e5e7eb'
const LOCKED_COLOR = '#6b7280'
const LABEL_COLOR = '#e5e7eb'

// Markeringen ligger uden om niveauringen.
const RING_GAP = 11
/** Afstand fra cirklen til niveauringen. */
const LEVEL_RING_GAP = 5
/** Farven på de stykker af niveauringen, der ikke er nået endnu. */
const EMPTY_SEGMENT_COLOR = '#4b5563'

/**
 * Et tal ud fra nodens id, så hver node pulserer i sin egen takt. Samme id
 * giver altid samme tal; Math.random() ville skifte ved hver tegning.
 */
function hashOf(text: string): number {
  let hash = 0
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 100000
  return hash
}

type TreeNodeProps = {
  node: LayoutNode
  selected: boolean
  onSelect: (id: string) => void
  /** Musen er over noden, eller den har fået fokus med tastaturet. */
  onHoverStart: (id: string, element: Element) => void
  onHoverEnd: () => void
}

/** Cirkel og navn for én node. Positionen kommer færdigregnet fra layoutet. */
export function TreeNode({
  node,
  selected,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: TreeNodeProps) {
  const radius = NODE_RADIUS[node.kind]
  const color = node.color ?? ROOT_COLOR
  const lines = wrapLabel(node.name)
  const glow = glowFor(node.kind, node.level)
  const level = node.level ?? 0
  // Glorien pulserer hurtigere, jo højere niveauet er (styres i index.css).
  const pulseSeconds = node.kind === 'skill' ? 5.5 - level * 0.7 : 4

  // Glimt, når niveauet stiger. Vi husker det forrige niveau i state og
  // sammenligner, mens komponenten tegnes; det er Reacts anbefalede måde at
  // reagere på en ændret prop uden en effekt. `burst` tæller op og bruges
  // som key, så glimtet starter forfra hver gang.
  const [previousLevel, setPreviousLevel] = useState(level)
  const [burst, setBurst] = useState(0)
  if (level !== previousLevel) {
    setPreviousLevel(level)
    if (level > previousLevel) setBurst(burst + 1)
  }

  function handleClick(event: MouseEvent) {
    // Ellers når klikket op til SVG'en, som tolker det som "klik ved siden af".
    event.stopPropagation()
    onSelect(node.id)
  }

  function handleKeyDown(event: KeyboardEvent) {
    // En rigtig <button> reagerer på Enter og mellemrum; det efterligner vi.
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(node.id)
    }
  }

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      data-node-id={node.id}
      className={`tree-node ${node.kind}`}
      role="button"
      tabIndex={0}
      aria-label={node.name}
      aria-pressed={selected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={(event) => onHoverStart(node.id, event.currentTarget)}
      onMouseLeave={onHoverEnd}
      onFocus={(event) => onHoverStart(node.id, event.currentTarget)}
      onBlur={onHoverEnd}
    >
      {/* Usynlig trykflade, der er større end cirklen, så noden kan rammes
          med en finger. Størrelsen styres i index.css (.node-hit). */}
      <circle className="node-hit" r={radius + 11} fill="transparent" />
      {/* Glorien tegnes først, så den ligger bag cirklen. Den er en sløret
          kopi i nodens egen farve (filteret står i TreeDrawing). */}
      {glow && (
        <circle
          className="node-glow"
          r={radius + glow.spread}
          fill={color}
          opacity={glow.opacity}
          filter={`url(#${GLOW_FILTER_ID})`}
          style={
            {
              '--glow': glow.opacity,
              animationDuration: `${pulseSeconds}s`,
              // Negativ forsinkelse: animationen er allerede i gang fra start.
              animationDelay: `-${hashOf(node.id) % 4000}ms`,
            } as CSSProperties
          }
        />
      )}
      {selected && (
        <circle
          className="selection-ring"
          r={radius + RING_GAP}
          fill="none"
          stroke={LABEL_COLOR}
          strokeWidth={2}
        />
      )}
      {/* Glimtet, første del: en ring, der breder sig bag cirklen.
          Animationerne står i index.css (.level-burst og .level-flash). */}
      {burst > 0 && (
        <g key={burst}>
          <circle
            className="level-burst"
            r={radius + LEVEL_RING_GAP}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
        </g>
      )}
      <circle r={radius} {...circleStyle(node, color)} />
      {/* Glimtet, anden del: et hvidt blink oven på cirklen. */}
      {burst > 0 && (
        <circle key={burst} className="level-flash" r={radius} fill="#fff" />
      )}
      {/* Niveauringen: fem stykker, farvet op til nodens niveau, så niveauet
          kan aflæses uden at åbne noget. */}
      {node.kind === 'skill' &&
        levelSegments(radius + LEVEL_RING_GAP).map((d, index) => (
          <path
            key={index}
            className={index < level ? 'level-segment filled' : 'level-segment'}
            d={d}
            fill="none"
            stroke={index < level ? color : EMPTY_SEGMENT_COLOR}
            strokeOpacity={index < level ? 1 : 0.5}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        ))}
      {/* Skriftstørrelsen sættes i index.css (.node-label), så navnet kan
          læses, også når der er zoomet langt ud. Linjeafstanden står derfor
          i em, som følger skriftstørrelsen. */}
      <text
        className="node-label"
        y={radius + 4}
        textAnchor="middle"
        fontSize={13}
        fontWeight={node.kind === 'skill' ? 400 : 600}
        fill={LABEL_COLOR}
      >
        {lines.map((line, index) => (
          <tspan key={index} x={0} dy={index === 0 ? '1em' : '1.15em'}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

/**
 * Stamme og hovedgrene er fyldte overskrifter. Undergrene: niveau 0 er gråt
 * og stiplet (ikke låst op); niveau 1-5 får stigende fyld i grenens farve.
 * Gløden ligger for sig i glowFor (layout/glow.ts).
 */
function circleStyle(
  node: LayoutNode,
  color: string,
): SVGProps<SVGCircleElement> {
  if (node.kind !== 'skill') {
    return { fill: color, stroke: color, strokeWidth: 2 }
  }
  const level = node.level ?? 0
  if (level === 0) {
    return {
      fill: 'none',
      stroke: LOCKED_COLOR,
      strokeWidth: 2,
      strokeDasharray: '4 3',
    }
  }
  return {
    fill: color,
    fillOpacity: 0.2 + level * 0.16,
    stroke: color,
    strokeWidth: 2,
  }
}
