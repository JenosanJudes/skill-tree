import type { SkillNode } from '../types/skillTree'

/** Finder noden med `id` et sted i træet. */
export function findNode(node: SkillNode, id: string): SkillNode | undefined {
  if (node.id === id) return node
  for (const child of node.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return undefined
}

/**
 * Vejen fra stammen ned til noden med `id`, begge medregnet. Første element er
 * altså stammen, andet er hovedgrenen (hvis der er en), og sidste er noden.
 */
export function findPath(node: SkillNode, id: string): SkillNode[] | undefined {
  if (node.id === id) return [node]
  for (const child of node.children) {
    const path = findPath(child, id)
    if (path) return [node, ...path]
  }
  return undefined
}

/** Dybden af noden: 0 = stammen, 1 = hovedgren, 2 eller mere = undergren. */
export function getDepth(
  node: SkillNode,
  id: string,
  depth = 0,
): number | undefined {
  if (node.id === id) return depth
  for (const child of node.children) {
    const found = getDepth(child, id, depth + 1)
    if (found !== undefined) return found
  }
  return undefined
}

/**
 * Returnerer et nyt træ, hvor noden med `id` er erstattet af `update(node)`.
 * Kun noderne på vejen fra roden ned til noden bliver kopieret; resten
 * genbruges. Ændres intet, returneres præcis det samme objekt.
 */
export function updateNode(
  node: SkillNode,
  id: string,
  update: (node: SkillNode) => SkillNode,
): SkillNode {
  if (node.id === id) return update(node)
  let changed = false
  const children = node.children.map((child) => {
    const updated = updateNode(child, id, update)
    if (updated !== child) changed = true
    return updated
  })
  return changed ? { ...node, children } : node
}

/**
 * Kun almindelige webadresser er tilladt. En adresse som `javascript:...`
 * ville køre kode, når man klikker på linket, og skal derfor afvises.
 */
export function isSafeUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/** Returnerer et nyt træ uden noden med `id` (og dens undernoder). */
export function removeNode(node: SkillNode, id: string): SkillNode {
  let changed = false
  const children: SkillNode[] = []
  for (const child of node.children) {
    if (child.id === id) {
      changed = true
      continue
    }
    const updated = removeNode(child, id)
    if (updated !== child) changed = true
    children.push(updated)
  }
  return changed ? { ...node, children } : node
}
