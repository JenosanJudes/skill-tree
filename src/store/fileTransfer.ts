import type { SkillNode, SkillTree } from '../types/skillTree'
import { validateTree } from './validateTree'
import type { ValidationResult } from './validateTree'

/**
 * JSON-teksten til en eksportfil. Uden noter fjernes `notes` og `links` fra
 * alle noder, som specen beskriver. Indrykning med 2 mellemrum gør filen let
 * at læse for både mennesker og en LLM.
 */
export function exportTree(tree: SkillTree, includeNotes: boolean): string {
  const data = includeNotes ? tree : { ...tree, root: withoutNotes(tree.root) }
  return JSON.stringify(data, null, 2) + '\n'
}

/** Fx `skill-tree-2026-11-05.json`, ud fra den lokale dato. */
export function exportFileName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return `skill-tree-${day}.json`
}

/**
 * Læser teksten fra en importeret fil. Først JSON.parse (er det overhovedet
 * JSON?), derefter samme validering som ved indlæsning fra localStorage.
 */
export function parseImport(text: string): ValidationResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, errors: ['Filen er ikke gyldig JSON.'] }
  }
  return validateTree(data)
}

/**
 * Den eneste funktion her med en sideeffekt: browseren gemmer en fil.
 * Vi laver en Blob (en fil i hukommelsen), en midlertidig adresse til den og
 * et usynligt link med `download`, som vi "klikker" på. Ingen server.
 */
export function downloadTree(
  tree: SkillTree,
  includeNotes: boolean,
  date = new Date(),
): void {
  const blob = new Blob([exportTree(tree, includeNotes)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = exportFileName(date)
  link.click()
  // Adressen holder filen i hukommelsen, så den frigives bagefter.
  URL.revokeObjectURL(url)
}

/** Kopi af noden og alle dens børn uden `notes` og `links`. */
function withoutNotes(node: SkillNode): SkillNode {
  const copy = { ...node, children: node.children.map(withoutNotes) }
  delete copy.notes
  delete copy.links
  return copy
}
