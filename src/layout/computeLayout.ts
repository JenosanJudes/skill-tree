import { hierarchy, tree } from 'd3-hierarchy'
import type { HierarchyPointNode } from 'd3-hierarchy'
import type { Level, SkillNode } from '../types/skillTree'

/** Mindste afstand mellem to ringe (SVG-enheder). */
export const RING_STEP = 130
/** Mindste afstand mellem to naboer på samme ring, målt i lige linje. */
export const NODE_SPACING = 110

/** Cirklens radius for hver type node. Layoutet ejer geometrien. */
export const NODE_RADIUS = { root: 18, branch: 15, skill: 11 } as const

// En forbindelse stopper lidt før cirklen, som stregerne i et stjernebillede.
const LINK_GAP = 5

// Luft omkring træet, så cirkler og navne ikke klippes af viewBox.
const PADDING_X = 80
const PADDING_TOP = 50
// Navnet står under noden og må gå på to linjer.
const PADDING_BOTTOM = 90

export type NodeKind = 'root' | 'branch' | 'skill'

export type LayoutNode = {
  id: string
  name: string
  /** Stamme, hovedgren eller undergren. Styrer udseendet. */
  kind: NodeKind
  level?: Level
  /** Hovedgrenens farve; arvet af alle undergrene. Stammen har ingen. */
  color?: string
  /** Id på den hovedgren, noden hører under (hovedgrenen selv inkl.). */
  branchId?: string
  x: number
  y: number
}

export type LayoutLink = {
  /** Id på barnet; hver node undtagen stammen har præcis én forbindelse. */
  id: string
  /** SVG-sti: en lige streg fra forælder til barn. */
  path: string
  /** Barnets farve, dvs. hovedgrenens. */
  color?: string
  /** Barnets type og niveau. Styrer, om der løber lys langs forbindelsen. */
  kind: NodeKind
  level?: Level
}

export type Bounds = { x: number; y: number; width: number; height: number }

export type Layout = {
  nodes: LayoutNode[]
  links: LayoutLink[]
  /** Passer til SVG'ens viewBox og rummer alle noder og navne. */
  bounds: Bounds
}

type Point = { x: number; y: number }

/** Afrunder til to decimaler. "+ 0" laver -0 om til 0. */
function round(value: number): number {
  return Math.round(value * 100) / 100 + 0
}

/**
 * Lige streg fra forælder til barn. Stregen begynder og slutter et lille
 * stykke uden for de to cirkler, så den ikke ses gennem dem.
 */
export function linkPath(
  source: Point,
  target: Point,
  sourceRadius: number,
  targetRadius: number,
): string {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const length = Math.hypot(dx, dy)
  const start = sourceRadius + LINK_GAP
  const end = length - targetRadius - LINK_GAP
  // Står noderne for tæt til en afkortet streg, tegnes den hele vejen.
  if (length === 0 || end <= start) {
    return `M${round(source.x)},${round(source.y)}L${round(target.x)},${round(target.y)}`
  }
  const ux = dx / length
  const uy = dy / length
  return (
    `M${round(source.x + ux * start)},${round(source.y + uy * start)}` +
    `L${round(source.x + ux * end)},${round(source.y + uy * end)}`
  )
}

/**
 * Hvor langt der skal være mellem ringene, for at naboer på samme ring står
 * mindst NODE_SPACING fra hinanden. Jo flere noder, jo større cirkel.
 */
function ringStep(nodes: HierarchyPointNode<SkillNode>[]): number {
  const anglesByDepth = new Map<number, number[]>()
  for (const node of nodes) {
    if (node.depth === 0) continue
    const angles = anglesByDepth.get(node.depth) ?? []
    angles.push(node.x)
    anglesByDepth.set(node.depth, angles)
  }

  let step = RING_STEP
  for (const [depth, angles] of anglesByDepth) {
    if (angles.length < 2) continue
    angles.sort((a, b) => a - b)
    // Mindste vinkel mellem to naboer, også hen over "sømmen" ved 0 og 2π.
    let minGap = 2 * Math.PI - (angles[angles.length - 1] - angles[0])
    for (let i = 1; i < angles.length; i++) {
      minGap = Math.min(minGap, angles[i] - angles[i - 1])
    }
    // Korden mellem to punkter på en cirkel er 2·r·sin(vinkel / 2).
    const radius = NODE_SPACING / (2 * Math.sin(Math.min(minGap, Math.PI) / 2))
    step = Math.max(step, radius / depth)
  }
  return step
}

/**
 * Regner positionerne ud for hele træet som et stjernekort: stammen står i
 * (0, 0), og hver dybde ligger på sin egen ring uden om den. d3 fordeler
 * noderne i vinkel (0 til 2π); vi laver vinkel og ring om til x og y.
 * Funktionen er ren og rører ikke `root`.
 */
export function computeLayout(root: SkillNode): Layout {
  // d3 laver sin egen hierarki-kopi; vores data bliver ikke ændret.
  // Her er node.x en vinkel. Søskende står tættere end fætre, og afstanden
  // deles med dybden, fordi samme vinkel fylder mere på en ydre ring.
  const positioned = tree<SkillNode>()
    .size([2 * Math.PI, 1])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)(
    hierarchy(root),
  )

  const descendants = positioned.descendants()
  const step = ringStep(descendants)

  const layoutOf = new Map<HierarchyPointNode<SkillNode>, LayoutNode>()
  for (const node of descendants) {
    // Farven kommer fra hovedgrenen (dybde 1) blandt nodens forfædre.
    const branch = node.ancestors().find((a) => a.depth === 1)
    const radius = node.depth * step
    layoutOf.set(node, {
      id: node.data.id,
      name: node.data.name,
      kind: node.depth === 0 ? 'root' : node.depth === 1 ? 'branch' : 'skill',
      level: node.data.level,
      color: branch?.data.color,
      branchId: branch?.data.id,
      // Vinklen π (midten af træet) peger lige op; sømmen ligger nederst,
      // hvor stammens navn står.
      x: round(-radius * Math.sin(node.x)),
      y: round(radius * Math.cos(node.x)),
    })
  }

  const nodes = [...layoutOf.values()]

  const links = positioned.links().flatMap(({ source, target }) => {
    const from = layoutOf.get(source)
    const to = layoutOf.get(target)
    return from && to
      ? [
          {
            id: to.id,
            path: linkPath(
              from,
              to,
              NODE_RADIUS[from.kind],
              NODE_RADIUS[to.kind],
            ),
            color: to.color,
            kind: to.kind,
            level: to.level,
          },
        ]
      : []
  })

  return { nodes, links, bounds: boundsOf(nodes) }
}

/** Det mindste rektangel om noderne, med luft til cirkler og navne. */
function boundsOf(nodes: LayoutNode[]): Bounds {
  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return {
    x: minX - PADDING_X,
    y: minY - PADDING_TOP,
    width: maxX - minX + 2 * PADDING_X,
    height: maxY - minY + PADDING_TOP + PADDING_BOTTOM,
  }
}

/**
 * Rammen om én hovedgren og alle dens undergrene. Bruges, når kameraet skal
 * flyve ind på grenen. Giver null, hvis id'et ikke er en hovedgren.
 */
export function branchBounds(layout: Layout, branchId: string): Bounds | null {
  const nodes = layout.nodes.filter((n) => n.branchId === branchId)
  return nodes.length > 0 ? boundsOf(nodes) : null
}
