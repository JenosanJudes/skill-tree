import type { SkillTree } from '../types/skillTree'

/**
 * Lille, fast træ til tests. Testene bruger ikke startskabelonen, så de ikke
 * går i stykker, når skabelonens indhold ændres.
 */
export function makeTestTree(): SkillTree {
  return {
    formatVersion: 1,
    root: {
      id: 'root',
      name: 'Rod',
      children: [
        {
          id: 'branch',
          name: 'Hovedgren',
          color: '#ff0000',
          children: [
            { id: 'leaf-a', name: 'Blad A', level: 1, children: [] },
            {
              id: 'leaf-b',
              name: 'Blad B',
              level: 2,
              children: [{ id: 'deep', name: 'Dyb', level: 0, children: [] }],
            },
          ],
        },
      ],
    },
  }
}
