import { computeLayout } from '../layout/computeLayout'
import { SHARE_HEIGHT, SHARE_WIDTH, shareSvg } from '../layout/shareImage'
import type { SkillTree } from '../types/skillTree'
import { rankFor, treeStats } from './treeStats'

/** Linjen under titlen på billedet, fx "ØVET · 34 / 70". */
export function shareSubtitle(tree: SkillTree): string {
  const { power, maxPower } = treeStats(tree.root)
  if (maxPower === 0) return 'Skill tree'
  return `${rankFor(power, maxPower).toUpperCase()} · ${power} / ${maxPower}`
}

/** Filnavn med dato, fx skill-tree-2026-11-17.png. */
export function shareFileName(date = new Date()): string {
  return `skill-tree-${date.toISOString().slice(0, 10)}.png`
}

/**
 * Laver SVG-tekst om til et PNG-billede. Browseren kan tegne en SVG som et
 * almindeligt billede på et <canvas>, og et canvas kan gemmes som PNG.
 */
async function svgToPng(
  svg: string,
  width: number,
  height: number,
): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Browseren kan ikke tegne billedet.')
    context.drawImage(image, 0, 0, width, height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error('Billedet blev tomt.')),
        'image/png',
      ),
    )
  } finally {
    // Adressen holder SVG'en i hukommelsen, så den frigives bagefter.
    URL.revokeObjectURL(url)
  }
}

/**
 * Laver et billede af træet og deler det. På en telefon åbnes systemets
 * "Del"-menu (navigator.share); kan browseren ikke dele filer, gemmes
 * billedet i stedet som en fil. Sideeffekter: ja, derfor ligger den i store.
 */
export async function shareTreeImage(tree: SkillTree): Promise<void> {
  const svg = shareSvg(computeLayout(tree.root), {
    title: tree.root.name,
    subtitle: shareSubtitle(tree),
  })
  const blob = await svgToPng(svg, SHARE_WIDTH, SHARE_HEIGHT)
  const file = new File([blob], shareFileName(), { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: tree.root.name })
    } catch (error) {
      // AbortError betyder, at brugeren lukkede menuen. Det er ikke en fejl.
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        throw error
      }
    }
    return
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}
