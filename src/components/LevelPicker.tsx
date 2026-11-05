import type { CSSProperties } from 'react'
import type { Level } from '../types/skillTree'
import { LEVEL_STEPS } from './levels'

type LevelPickerProps = {
  level: Level
  color: string
  onChange: (level: Level) => void
}

/**
 * Fem cirkler. Klik på cirkel n sætter niveau n. Klik på den cirkel, der
 * allerede er valgt, sætter niveau 0 (ikke låst op), så man kan gå helt ned.
 */
export function LevelPicker({ level, color, onChange }: LevelPickerProps) {
  return (
    <fieldset className="field level-picker">
      <legend className="field-label">
        Niveau: {level === 0 ? 'ikke låst op' : `${level} af 5`}
      </legend>
      <div className="level-dots">
        {LEVEL_STEPS.map((n) => (
          <button
            key={n}
            type="button"
            className="level-dot"
            aria-label={`Niveau ${n}`}
            aria-pressed={n <= level}
            // Farven lægges i en CSS-variabel, som stylesheetet bruger.
            style={{ '--branch-color': color } as CSSProperties}
            onClick={() => onChange(n === level ? 0 : n)}
          />
        ))}
      </div>
    </fieldset>
  )
}
