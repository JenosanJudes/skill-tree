import type { CSSProperties } from 'react'
import type { Level } from '../types/skillTree'
import { LEVEL_STEPS } from './levels'

type LevelDotsProps = {
  level: Level
  color: string
}

/**
 * Fem små cirkler, der kun kan læses. Skærmlæsere får ét samlet navn
 * ("Niveau 3 af 5") i stedet for fem tomme cirkler.
 */
export function LevelDots({ level, color }: LevelDotsProps) {
  const label = level === 0 ? 'Ikke låst op' : `Niveau ${level} af 5`
  return (
    <span
      className="level-dots-small"
      role="img"
      aria-label={label}
      style={{ '--branch-color': color } as CSSProperties}
    >
      {LEVEL_STEPS.map((n) => (
        <span
          key={n}
          className={n <= level ? 'level-dot-small filled' : 'level-dot-small'}
        />
      ))}
    </span>
  )
}
