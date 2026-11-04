import { hierarchy, tree } from 'd3-hierarchy'
import type { HierarchyPointNode } from 'd3-hierarchy'
import type { Level, SkillNode } from '../types/skillTree'

/** Vandret afstand mellem noder på samme række (SVG-enheder). */
export const NODE_WIDTH = 140
/** Lodret afstand mellem rækkerne. */
export const LEVEL_HEIGHT = 120

// Luft omkring træet, så cirkler og navne ikke klippes af viewBox.
const PADDING_X = NODE_WIDTH / 2
const PADDING_TOP = 40
// Navnet står under noden og må gå på to linjer.
const PADDING_BOTTOM = 80

export type NodeKind = 'root' | 'branch' | 'skill'

export type LayoutNode = {
  id: string
  name: string
  /** Stamme, hovedgren eller undergren. Styrer udseendet. */
  kind: NodeKind
  level?: Level
  /** Hovedgrenens farve; arvet af alle undergrene. Stammen har ingen. */
  color?: string
  x: number
  y: number
}

export type LayoutLink = {
  /** Id på barnet; hver node undtagen stammen har præcis én forbindelse. */
  id: string
  /** SVG-sti med knæk: lodret, vandret, lodret. */
  path: string
  /** Barnets farve, dvs. hovedgrenens. */
  color?: string
}

export type Layout = {
  nodes: LayoutNode[]
  links: LayoutLink[]
  /** Passer til SVG'ens viewBox og rummer alle noder og navne. */
  bounds: { x: number; y: number; width: number; height: number }
}

type Point = { x: number; y: number }

/** Sti fra forælder til barn med et vandret knæk midtvejs. */
export function elbowPath(source: Point, target: Point): string {
  const midY = (source.y + target.y) / 2
  return `M${source.x},${source.y}V${midY}H${target.x}V${target.y}`
}

/**
 * Regner positionerne ud for hele træet. Stammen står i (0, 0), og grenene
 * vokser opad, dvs. mod negative y. Funktionen er ren og rører ikke `root`.
 */
export function computeLayout(root: SkillNode): Layout {
  // d3 laver sin egen hierarki-kopi; vores data bliver ikke ændret.
  // tree() returnerer en node, hvor x og y er regnet ud (altid tal).
  const positioned = tree<SkillNode>().nodeSize([NODE_WIDTH, LEVEL_HEIGHT])(
    hierarchy(root),
  )

  const layoutOf = new Map<HierarchyPointNode<SkillNode>, LayoutNode>()
  for (const node of positioned.descendants()) {
    // Farven kommer fra hovedgrenen (dybde 1) blandt nodens forfædre.
    const branch = node.ancestors().find((a) => a.depth === 1)
    layoutOf.set(node, {
      id: node.data.id,
      name: node.data.name,
      kind: node.depth === 0 ? 'root' : node.depth === 1 ? 'branch' : 'skill',
      level: node.data.level,
      color: branch?.data.color,
      x: node.x,
      // d3 lader y vokse nedad; vi vender den, så træet vokser opad.
      // "0 -" i stedet for "-" undgår -0 på stammen.
      y: 0 - node.y,
    })
  }

  const nodes = [...layoutOf.values()]

  const links = positioned.links().flatMap(({ source, target }) => {
    const from = layoutOf.get(source)
    const to = layoutOf.get(target)
    return from && to
      ? [{ id: to.id, path: elbowPath(from, to), color: to.color }]
      : []
  })

  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    nodes,
    links,
    bounds: {
      x: minX - PADDING_X,
      y: minY - PADDING_TOP,
      width: maxX - minX + 2 * PADDING_X,
      height: maxY - minY + PADDING_TOP + PADDING_BOTTOM,
    },
  }
}
