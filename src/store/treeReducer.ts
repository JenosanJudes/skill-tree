import type { Level, SkillNode, SkillTree } from '../types/skillTree'
import {
  findNode,
  getDepth,
  isSafeUrl,
  removeNode,
  updateNode,
} from './treeUtils'

/** Farve til en ny hovedgren. Den kan ændres i sidepanelet bagefter. */
export const DEFAULT_BRANCH_COLOR = '#90a4ae'

export type TreeAction =
  | { type: 'addNode'; parentId: string; id: string; name: string }
  | { type: 'renameNode'; id: string; name: string }
  | { type: 'deleteNode'; id: string }
  | { type: 'setLevel'; id: string; level: Level }
  | { type: 'setDescription'; id: string; description: string }
  | { type: 'setNotes'; id: string; notes: string }
  | { type: 'addLink'; id: string; title: string; url: string }
  | { type: 'removeLink'; id: string; index: number }
  | { type: 'setColor'; id: string; color: string }
  /** Hele træet erstattes, fx ved import. Træet skal være valideret først. */
  | { type: 'replaceTree'; tree: SkillTree }

/** Den del af TreeAction, der har type 'addNode'. */
export type AddNodeAction = Extract<TreeAction, { type: 'addNode' }>

/**
 * Laver en addNode-handling med et nyt id. Id'et genereres her og ikke i
 * reduceren, så reduceren forbliver ren: samme input giver altid samme output.
 */
export function addNode(parentId: string, name: string): AddNodeAction {
  return { type: 'addNode', parentId, id: crypto.randomUUID(), name }
}

/**
 * Ren funktion: tager det nuværende træ og en handling og returnerer et nyt
 * træ. Er handlingen ugyldig eller ændrer intet, returneres det samme objekt,
 * så React ved, at der ikke skal tegnes igen.
 */
export function treeReducer(state: SkillTree, action: TreeAction): SkillTree {
  switch (action.type) {
    case 'addNode': {
      const name = action.name.trim()
      const parentDepth = getDepth(state.root, action.parentId)
      if (!name || parentDepth === undefined) return state
      if (findNode(state.root, action.id)) return state

      // Under stammen opstår en hovedgren (farve, intet niveau),
      // ellers en undergren (niveau 0, arver farven).
      const newNode: SkillNode =
        parentDepth === 0
          ? { id: action.id, name, color: DEFAULT_BRANCH_COLOR, children: [] }
          : { id: action.id, name, level: 0, children: [] }

      return withRoot(
        state,
        updateNode(state.root, action.parentId, (parent) => ({
          ...parent,
          children: [...parent.children, newNode],
        })),
      )
    }

    case 'renameNode': {
      const name = action.name.trim()
      if (!name) return state
      return withRoot(
        state,
        updateNode(state.root, action.id, (node) =>
          node.name === name ? node : { ...node, name },
        ),
      )
    }

    case 'deleteNode': {
      if (action.id === state.root.id) return state
      return withRoot(state, removeNode(state.root, action.id))
    }

    case 'setLevel': {
      // Kun undergrene har niveau, ikke stammen (0) eller hovedgrene (1).
      const depth = getDepth(state.root, action.id)
      if (depth === undefined || depth < 2) return state
      return withRoot(
        state,
        updateNode(state.root, action.id, (node) =>
          node.level === action.level ? node : { ...node, level: action.level },
        ),
      )
    }

    case 'setDescription':
      return withRoot(
        state,
        updateNode(state.root, action.id, (node) =>
          withText(node, 'description', action.description),
        ),
      )

    case 'setNotes':
      return withRoot(
        state,
        updateNode(state.root, action.id, (node) =>
          withText(node, 'notes', action.notes),
        ),
      )

    case 'addLink': {
      const url = action.url.trim()
      if (!isSafeUrl(url)) return state
      // Uden titel bruges adressen selv som titel.
      const link = { title: action.title.trim() || url, url }
      return withRoot(
        state,
        updateNode(state.root, action.id, (node) => ({
          ...node,
          links: [...(node.links ?? []), link],
        })),
      )
    }

    case 'removeLink':
      return withRoot(
        state,
        updateNode(state.root, action.id, (node) => {
          const links = node.links ?? []
          if (action.index < 0 || action.index >= links.length) return node
          const remaining = links.filter((_, index) => index !== action.index)
          if (remaining.length > 0) return { ...node, links: remaining }
          // Den sidste er væk: fjern hele feltet i stedet for en tom liste.
          const copy = { ...node }
          delete copy.links
          return copy
        }),
      )

    case 'setColor': {
      // Kun hovedgrene har farve, og kun i formen #rrggbb,
      // som er det, en farvevælger (<input type="color">) giver.
      if (getDepth(state.root, action.id) !== 1) return state
      if (!/^#[0-9a-f]{6}$/i.test(action.color)) return state
      const color = action.color.toLowerCase()
      return withRoot(
        state,
        updateNode(state.root, action.id, (node) =>
          node.color === color ? node : { ...node, color },
        ),
      )
    }

    case 'replaceTree':
      // Valideringen sker i parseImport, før handlingen sendes. Reduceren
      // stoler på det, så den forbliver enkel.
      return action.tree
  }
}

function withRoot(state: SkillTree, root: SkillNode): SkillTree {
  return root === state.root ? state : { ...state, root }
}

/**
 * Sætter et valgfrit tekstfelt. En tom tekst fjerner feltet helt, så den
 * gemte JSON ikke fyldes med `"notes": ""`. Uændret tekst giver samme node.
 */
function withText(
  node: SkillNode,
  key: 'description' | 'notes',
  value: string,
): SkillNode {
  const text = value.trim()
  if ((node[key] ?? '') === text) return node
  if (text) return { ...node, [key]: text }
  // delete på en kopi, ikke på den oprindelige node, så reduceren forbliver ren.
  const copy = { ...node }
  delete copy[key]
  return copy
}
