import { DEFAULT_BRANCH_COLOR } from '../store/treeReducer'
import { isHexColor } from '../store/treeUtils'
import { NODE_RADIUS } from './computeLayout'
import type { Layout, LayoutNode } from './computeLayout'
import { glowFor } from './glow'
import { levelSegments } from './levelRing'
import { seededRandom } from './stars'
import { wrapLabel } from './wrapLabel'

/** Billedets størrelse i pixels: højformat, som passer til telefoner og opslag. */
export const SHARE_WIDTH = 1080
export const SHARE_HEIGHT = 1350

// Den del af billedet, træet må fylde. Over den står titlen.
const AREA = { x: 70, y: 260, width: 940, height: 960 }
/** Så meget forstørres et lille træ højst. */
const MAX_SCALE = 2.2
/** Navnene er mindst så høje i det færdige billede (pixels). */
const MIN_LABEL_PIXELS = 22

const ROOT_COLOR = '#e5e7eb'
const LOCKED_COLOR = '#6b7280'
const FONT = 'Helvetica, Arial, sans-serif'

export type ShareText = {
  /** Stor overskrift, typisk stammens navn. */
  title: string
  /** Linjen under, fx titel og kraft. */
  subtitle: string
}

/**
 * Tegn, der betyder noget i SVG, skrives om, så et navn som "C < D & E"
 * vises som tekst og ikke bliver læst som kode.
 */
function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Farver kommer fra brugerens data; alt andet end #rrggbb erstattes. */
function safeColor(color: string | undefined, fallback: string): string {
  return color && isHexColor(color) ? color : fallback
}

function starsSvg(): string {
  const random = seededRandom(11)
  let stars = ''
  for (let i = 0; i < 170; i++) {
    const x = (random() * SHARE_WIDTH).toFixed(0)
    const y = (random() * SHARE_HEIGHT).toFixed(0)
    const radius = (0.6 + random() * 1.5).toFixed(1)
    const opacity = (0.25 + random() * 0.6).toFixed(2)
    stars += `<circle cx="${x}" cy="${y}" r="${radius}" fill="#fff" opacity="${opacity}"/>`
  }
  return stars
}

function nodeSvg(node: LayoutNode, fontSize: number): string {
  const radius = NODE_RADIUS[node.kind]
  const color = safeColor(node.color, ROOT_COLOR)
  const level = node.level ?? 0
  const glow = glowFor(node.kind, node.level)
  const locked = node.kind === 'skill' && level === 0

  let svg = `<g transform="translate(${node.x},${node.y})">`
  if (glow) {
    svg += `<circle r="${radius + glow.spread}" fill="${color}" opacity="${glow.opacity}" filter="url(#glow)"/>`
  }
  svg += locked
    ? `<circle r="${radius}" fill="none" stroke="${LOCKED_COLOR}" stroke-width="2" stroke-dasharray="4 3"/>`
    : `<circle r="${radius}" fill="${color}" fill-opacity="${node.kind === 'skill' ? 0.2 + level * 0.16 : 1}" stroke="${color}" stroke-width="2"/>`
  if (node.kind === 'skill') {
    levelSegments(radius + 5).forEach((d, index) => {
      const filled = index < level
      svg += `<path d="${d}" fill="none" stroke="${filled ? color : '#4b5563'}" stroke-opacity="${filled ? 1 : 0.5}" stroke-width="2.5" stroke-linecap="round"/>`
    })
  }
  const lines = wrapLabel(node.name)
    .map(
      (line, index) =>
        `<tspan x="0" dy="${index === 0 ? '1em' : '1.15em'}">${escapeXml(line)}</tspan>`,
    )
    .join('')
  svg += `<text y="${radius + 6}" text-anchor="middle" font-size="${fontSize.toFixed(1)}" font-weight="${node.kind === 'skill' ? 400 : 700}" fill="#e5e7eb" stroke="#000" stroke-width="${(fontSize * 0.28).toFixed(1)}" stroke-linejoin="round" paint-order="stroke">${lines}</text>`
  return `${svg}</g>`
}

/**
 * Hele træet som ét selvstændigt SVG-billede med stjernehimmel, titel og
 * undertitel. Billedet bygges direkte ud fra layoutet og ikke ved at kopiere
 * skærmens SVG, fordi skærmens udseende kommer fra index.css, som ikke
 * følger med i en billedfil. Ren funktion: samme træ giver samme tekst.
 */
export function shareSvg(layout: Layout, text: ShareText): string {
  const { bounds } = layout
  const scale = Math.min(
    AREA.width / bounds.width,
    AREA.height / bounds.height,
    MAX_SCALE,
  )
  // Træets midte skal ligge i midten af det område, det må fylde.
  const offsetX =
    AREA.x + AREA.width / 2 - scale * (bounds.x + bounds.width / 2)
  const offsetY =
    AREA.y + AREA.height / 2 - scale * (bounds.y + bounds.height / 2)
  const fontSize = Math.max(13, MIN_LABEL_PIXELS / scale)

  const links = layout.links
    .map((link) => {
      const unlocked = link.kind !== 'skill' || (link.level ?? 0) > 0
      return `<path d="${link.path}" fill="none" stroke="${safeColor(link.color, DEFAULT_BRANCH_COLOR)}" stroke-opacity="${unlocked ? 0.6 : 0.3}" stroke-width="2"${unlocked ? '' : ' stroke-dasharray="3 6"'}/>`
    })
    .join('')
  const nodes = layout.nodes.map((node) => nodeSvg(node, fontSize)).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SHARE_WIDTH}" height="${SHARE_HEIGHT}" viewBox="0 0 ${SHARE_WIDTH} ${SHARE_HEIGHT}" font-family="${FONT}">` +
    `<defs>` +
    `<radialGradient id="sky" cx="50%" cy="55%" r="70%"><stop offset="0" stop-color="#101a3a"/><stop offset="1" stop-color="#000"/></radialGradient>` +
    `<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>` +
    `</defs>` +
    `<rect width="${SHARE_WIDTH}" height="${SHARE_HEIGHT}" fill="url(#sky)"/>` +
    starsSvg() +
    `<text x="${SHARE_WIDTH / 2}" y="130" text-anchor="middle" font-size="64" font-weight="700" fill="#fff">${escapeXml(text.title)}</text>` +
    `<text x="${SHARE_WIDTH / 2}" y="190" text-anchor="middle" font-size="30" fill="#fde68a" letter-spacing="3">${escapeXml(text.subtitle)}</text>` +
    `<g transform="translate(${offsetX.toFixed(2)},${offsetY.toFixed(2)}) scale(${scale.toFixed(4)})">${links}${nodes}</g>` +
    `</svg>`
  )
}
