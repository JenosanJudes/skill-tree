/**
 * SVG kan ikke ombryde tekst selv, så vi deler navnet op i linjer.
 * Ord samles på en linje, så længe den ikke bliver længere end `maxChars`.
 * Bliver der flere linjer end `maxLines`, samles resten på sidste linje og
 * forkortes med "…". Et enkelt ord, der er for langt, forkortes også.
 */
export function wrapLabel(text: string, maxChars = 18, maxLines = 2): string[] {
  const words = text.split(/\s+/).filter(Boolean)

  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    // Et ord, der alene er for langt, får sin egen linje og forkortes senere.
    if (!current || candidate.length <= maxChars) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)

  if (lines.length <= maxLines) return lines.map((l) => shorten(l, maxChars))

  const kept = lines.slice(0, maxLines - 1)
  const last = lines.slice(maxLines - 1).join(' ')
  return [...kept, shorten(last, maxChars)].map((l) => shorten(l, maxChars))
}

function shorten(line: string, maxChars: number): string {
  if (line.length <= maxChars) return line
  return `${line.slice(0, maxChars - 1).trimEnd()}…`
}
