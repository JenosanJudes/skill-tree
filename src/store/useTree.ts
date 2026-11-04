import { createContext, useContext } from 'react'
import type { Dispatch } from 'react'
import type { SkillTree } from '../types/skillTree'
import type { TreeAction } from './treeReducer'

export type TreeContextValue = {
  tree: SkillTree
  dispatch: Dispatch<TreeAction>
}

// null betyder "ingen TreeProvider ovenover", og det fanger useTree nedenfor.
// Context og hook ligger her og ikke i TreeContext.tsx, så den fil kun
// eksporterer en komponent (ellers virker Fast refresh ikke).
export const TreeContext = createContext<TreeContextValue | null>(null)

/** Henter træet og dispatch. Skal bruges under en TreeProvider. */
export function useTree(): TreeContextValue {
  const value = useContext(TreeContext)
  if (value === null) {
    throw new Error('useTree skal bruges inde i en TreeProvider.')
  }
  return value
}
