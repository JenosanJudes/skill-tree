import { useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { SkillTree } from '../types/skillTree'
import { loadTree } from './storage'
import { treeReducer } from './treeReducer'
import { TreeContext } from './useTree'

type TreeProviderProps = {
  children: ReactNode
  /** Bruges i tests. Uden den indlæses træet fra localStorage eller skabelonen. */
  initialTree?: SkillTree
}

/**
 * Tree store: holder træet i hukommelsen og stiller det til rådighed for alle
 * komponenter nedenunder. Gemning i localStorage kommer i trin 5, hvor træet
 * kan redigeres.
 */
export function TreeProvider({ children, initialTree }: TreeProviderProps) {
  // Tredje argument kører kun ved første render, så loadTree() ikke kaldes
  // igen hver gang træet ændres.
  const [tree, dispatch] = useReducer(
    treeReducer,
    initialTree,
    (initial) => initial ?? loadTree(),
  )

  // Uden useMemo ville value være et nyt objekt ved hver render, og alle
  // komponenter, der bruger træet, ville tegnes igen uden grund.
  const value = useMemo(() => ({ tree, dispatch }), [tree])

  return <TreeContext value={value}>{children}</TreeContext>
}
