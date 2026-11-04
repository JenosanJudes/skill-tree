import type { SVGProps } from 'react'
import type { LayoutNode } from '../layout/computeLayout'
import { wrapLabel } from '../layout/wrapLabel'

const RADIUS = { root: 18, branch: 15, skill: 11 } as const
const ROOT_COLOR = '#e5e7eb'
const LOCKED_COLOR = '#6b7280'
const LABEL_COLOR = '#e5e7eb'
const LINE_HEIGHT = 15

type TreeNodeProps = {
  node: LayoutNode
}

/** Cirkel og navn for én node. Positionen kommer færdigregnet fra layoutet. */
export function TreeNode({ node }: TreeNodeProps) {
  const radius = RADIUS[node.kind]
  const color = node.color ?? ROOT_COLOR
  const lines = wrapLabel(node.name)

  return (
    <g transform={`translate(${node.x},${node.y})`} data-node-id={node.id}>
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
 * Glød efter niveau kommer i trin 8.
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
