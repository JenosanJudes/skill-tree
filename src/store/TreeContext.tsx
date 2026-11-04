import { useEffect, useMemo, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import type { SkillTree } from '../types/skillTree'
import { SAVE_DELAY_MS, loadTree, saveTree } from './storage'
import { treeReducer } from './treeReducer'
import { TreeContext } from './useTree'

type TreeProviderProps = {
  children: ReactNode
  /** Bruges i tests. Uden den indlæses træet fra localStorage eller skabelonen. */
  initialTree?: SkillTree
}

/**
 * Tree store: holder træet i hukommelsen, stiller det til rådighed for alle
 * komponenter nedenunder og gemmer det automatisk i localStorage.
 */
export function TreeProvider({ children, initialTree }: TreeProviderProps) {
  // Tredje argument kører kun ved første render, så loadTree() ikke kaldes
  // igen hver gang træet ændres.
  const [tree, dispatch] = useReducer(
    treeReducer,
    initialTree,
    (initial) => initial ?? loadTree(),
  )

  // Det træ, vi startede med. Det er allerede gemt (eller er skabelonen),
  // så det skal ikke skrives igen, før brugeren har ændret noget.
  const startTree = useRef(tree)

  // Autosave med debounce: hver ændring starter en ny nedtælling og annullerer
  // den forrige (via oprydningsfunktionen). Først når der har været stille i
  // SAVE_DELAY_MS, gemmes træet. Så skrives der ikke ved hvert tastetryk.
  useEffect(() => {
    if (tree === startTree.current) return
    const timer = setTimeout(() => {
      if (!saveTree(tree)) {
        console.warn('Træet kunne ikke gemmes i localStorage.')
      }
    }, SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [tree])

  // Uden useMemo ville value være et nyt objekt ved hver render, og alle
  // komponenter, der bruger træet, ville tegnes igen uden grund.
  const value = useMemo(() => ({ tree, dispatch }), [tree])

  return <TreeContext value={value}>{children}</TreeContext>
}
