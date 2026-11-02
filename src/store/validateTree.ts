import type { SkillTree } from '../types/skillTree'

export type ValidationResult =
  { ok: true; tree: SkillTree } | { ok: false; errors: string[] }

/**
 * Tjekker, at data udefra (localStorage eller en importeret fil) har formen
 * SkillTree. TypeScript tjekker kun kode ved kompilering, så data, der læses
 * ind mens appen kører, skal tjekkes her.
 */
export function validateTree(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return { ok: false, errors: ['Data er ikke et JSON-objekt.'] }
  }

  const errors: string[] = []
  if (data.formatVersion !== 1) {
    errors.push(
      `Ukendt formatVersion: ${String(data.formatVersion)} (forventede 1).`,
    )
  }
  if (isObject(data.root)) {
    validateNode(data.root, '', new Set(), errors)
  } else {
    errors.push('Mangler "root".')
  }

  // Når alle tjek er bestået, ved vi, at data har den rigtige form,
  // og så er det sikkert at fortælle TypeScript det med "as".
  return errors.length === 0
    ? { ok: true, tree: data as SkillTree }
    : { ok: false, errors }
}

function validateNode(
  node: Record<string, unknown>,
  parentPath: string,
  seenIds: Set<string>,
  errors: string[],
): void {
  const label = typeof node.name === 'string' ? node.name : '(uden navn)'
  const path = parentPath ? `${parentPath} > ${label}` : label

  if (typeof node.id !== 'string' || node.id === '') {
    errors.push(`${path}: "id" skal være en tekst, der ikke er tom.`)
  } else if (seenIds.has(node.id)) {
    errors.push(`${path}: id "${node.id}" bruges mere end én gang.`)
  } else {
    seenIds.add(node.id)
  }

  if (typeof node.name !== 'string') {
    errors.push(`${path}: "name" skal være en tekst.`)
  }

  for (const key of ['description', 'color', 'notes']) {
    if (node[key] !== undefined && typeof node[key] !== 'string') {
      errors.push(`${path}: "${key}" skal være en tekst.`)
    }
  }

  if (node.level !== undefined && !isLevel(node.level)) {
    errors.push(`${path}: "level" skal være et helt tal fra 0 til 5.`)
  }

  if (node.links !== undefined) {
    const linksOk =
      Array.isArray(node.links) &&
      node.links.every(
        (link) =>
          isObject(link) &&
          typeof link.title === 'string' &&
          typeof link.url === 'string',
      )
    if (!linksOk) {
      errors.push(`${path}: "links" skal være en liste af { title, url }.`)
    }
  }

  if (!Array.isArray(node.children)) {
    errors.push(`${path}: "children" skal være en liste.`)
    return
  }
  for (const child of node.children) {
    if (isObject(child)) {
      validateNode(child, path, seenIds, errors)
    } else {
      errors.push(`${path}: en undernode er ikke et objekt.`)
    }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLevel(value: unknown): boolean {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 5
  )
}
