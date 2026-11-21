/** Et lag stjerner: en flise, der gentages over hele skærmen. */
export type StarLayer = {
  /** Flisens sidelængde i pixels. */
  size: number
  /** Hvor meget laget flytter sig, når kameraet flytter sig (0 = står stille). */
  parallax: number
  /** CSS-værdi til background-image: én radial-gradient pr. stjerne. */
  image: string
}

const STAR_TINTS = ['255 255 255', '190 215 255', '255 230 200']

/**
 * Lille tilfældighedsgenerator med et frø (mulberry32). Samme frø giver
 * altid de samme tal, så stjernerne står samme sted hver gang, og funktionen
 * er ren. Math.random() ville give en ny himmel ved hver tegning.
 */
export function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Én flise med `count` stjerner, tegnet som små runde farveovergange. */
export function starTile(
  seed: number,
  count: number,
  size: number,
  maxRadius: number,
): string {
  const random = seededRandom(seed)
  const stars: string[] = []
  for (let i = 0; i < count; i++) {
    const x = Math.round(random() * size)
    const y = Math.round(random() * size)
    const radius = (0.4 + random() * (maxRadius - 0.4)).toFixed(1)
    const opacity = (0.35 + random() * 0.6).toFixed(2)
    const tint = STAR_TINTS[Math.floor(random() * STAR_TINTS.length)]
    stars.push(
      `radial-gradient(circle at ${x}px ${y}px, rgb(${tint} / ${opacity}) 0 ${radius}px, transparent ${Number(radius) + 0.6}px)`,
    )
  }
  return stars.join(', ')
}

/**
 * To lag: mange små stjerner langt væk, der næsten står stille, og få større
 * tættere på, der flytter sig mere. Forskellen i fart giver dybde (parallakse).
 * Fliserne har forskellig størrelse, så mønstret ikke gentager sig synligt.
 */
export const STAR_LAYERS: StarLayer[] = [
  { size: 263, parallax: 0.08, image: starTile(7, 22, 263, 0.9) },
  { size: 397, parallax: 0.2, image: starTile(42, 9, 397, 1.5) },
]
