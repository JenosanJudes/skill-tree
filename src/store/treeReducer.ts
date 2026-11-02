import type { Level, SkillNode, SkillTree } from '../types/skillTree'
import { findNode, getDepth, removeNode, updateNode } from './treeUtils'

/** Farve til en ny hovedgren, indtil den kan vælges i sidepanelet (trin 5). */
export const DEFAULT_BRANCH_COLOR = '#90a4ae'

export type TreeAction =
  | { type: 'addNode'; parentId: string; id: string; name: string }
  | { type: 'renameNode'; id: string; name: string }
  | { type: 'deleteNode'; id: string }
  | { type: 'setLevel'; id: string; level: Level }

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
  }
}

function withRoot(state: SkillTree, root: SkillNode): SkillTree {
  return root === state.root ? state : { ...state, root }
}
