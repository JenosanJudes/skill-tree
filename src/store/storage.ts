import defaultTreeJson from '../data/defaultTree.json'
import type { SkillTree } from '../types/skillTree'
import { validateTree } from './validateTree'

export const STORAGE_KEY = 'skill-tree'
export const BACKUP_KEY = 'skill-tree:backup'

/** Ventetid uden nye ændringer, før træet gemmes (debounce). */
export const SAVE_DELAY_MS = 300

/** En frisk kopi af startskabelonen. */
export function getDefaultTree(): SkillTree {
  const result = validateTree(defaultTreeJson)
  if (!result.ok) {
    throw new Error(`Startskabelonen er ugyldig: ${result.errors.join(' ')}`)
  }
  // Kopi, så ændringer aldrig rammer selve skabelonen i hukommelsen.
  return structuredClone(result.tree)
}

/**
 * Indlæser træet fra localStorage. Er intet gemt, bruges startskabelonen.
 * Er det gemte ugyldigt, gemmes det under BACKUP_KEY, så det ikke går tabt,
 * og startskabelonen bruges.
 */
export function loadTree(): SkillTree {
  const raw = readItem(STORAGE_KEY)
  if (raw === null) return getDefaultTree()

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = undefined
  }

  const result = validateTree(parsed)
  if (result.ok) return result.tree

  console.warn(
    `Det gemte træ er ugyldigt og er flyttet til "${BACKUP_KEY}".`,
    result.errors,
  )
  writeItem(BACKUP_KEY, raw)
  return getDefaultTree()
}

/** Gemmer træet. Returnerer false, hvis browseren ikke tillod det. */
export function saveTree(tree: SkillTree): boolean {
  return writeItem(STORAGE_KEY, JSON.stringify(tree))
}

// localStorage kan kaste en fejl, fx hvis lageret er fuldt eller blokeret.
function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}
