import type { KeyboardEvent, MouseEvent, SVGProps } from 'react'
import type { LayoutNode } from '../layout/computeLayout'
import { GLOW_FILTER_ID, glowFor } from '../layout/glow'
import { wrapLabel } from '../layout/wrapLabel'

const RADIUS = { root: 18, branch: 15, skill: 11 } as const
const ROOT_COLOR = '#e5e7eb'
const LOCKED_COLOR = '#6b7280'
const LABEL_COLOR = '#e5e7eb'
const LINE_HEIGHT = 15

const RING_GAP = 6

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
  const radius = RADIUS[node.kind]
  const color = node.color ?? ROOT_COLOR
  const lines = wrapLabel(node.name)
  const glow = glowFor(node.kind, node.level)

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
      className="tree-node"
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
      {/* Glorien tegnes først, så den ligger bag cirklen. Den er en sløret
          kopi i nodens egen farve (filteret står i TreeDrawing). */}
      {glow && (
        <circle
          className="node-glow"
          r={radius + glow.spread}
          fill={color}
          opacity={glow.opacity}
          filter={`url(#${GLOW_FILTER_ID})`}
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
      <circle r={radius} {...circleStyle(node, color)} />
      <text
        y={radius + 16}
        textAnchor="middle"
        fontSize={13}
        fontWeight={node.kind === 'skill' ? 400 : 600}
        fill={LABEL_COLOR}
      >
        {lines.map((line, index) => (
          <tspan key={index} x={0} dy={index === 0 ? 0 : LINE_HEIGHT}>
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
