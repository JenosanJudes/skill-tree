import type { CSSProperties } from 'react'
import { DEFAULT_BRANCH_COLOR } from '../store/treeReducer'
import { rankFor, treeStats } from '../store/treeStats'
import { useTree } from '../store/useTree'

/** Andel i procent, til bredden på en bjælke. */
function percent(power: number, maxPower: number): number {
  return maxPower > 0 ? Math.round((power / maxPower) * 100) : 0
}

/**
 * Lille måler med træets samlede kraft, en titel og en bjælke pr. hovedgren.
 * Den viser kun; alt regnes ud fra træet af treeStats.
 */
export function PowerMeter() {
  const { tree } = useTree()
  const stats = treeStats(tree.root)
  if (stats.maxPower === 0) return null

  return (
    <section className="power-meter" aria-label="Kraft">
      <p className="power-meter-top">
        <span className="power-meter-rank">
          {rankFor(stats.power, stats.maxPower)}
        </span>
        <span className="power-meter-total">
          <strong>{stats.power}</strong> / {stats.maxPower}
        </span>
      </p>
      <div
        className="power-bar total"
        role="progressbar"
        aria-label="Samlet kraft"
        aria-valuemin={0}
        aria-valuemax={stats.maxPower}
        aria-valuenow={stats.power}
      >
        <span style={{ width: `${percent(stats.power, stats.maxPower)}%` }} />
      </div>
      <ul className="power-meter-branches">
        {stats.branches
          .filter((branch) => branch.maxPower > 0)
          .map((branch) => (
            <li
              key={branch.id}
              style={
                {
                  '--branch-color': branch.color ?? DEFAULT_BRANCH_COLOR,
                } as CSSProperties
              }
            >
              <span className="power-meter-branch-name">{branch.name}</span>
              <div
                className="power-bar"
                role="progressbar"
                aria-label={branch.name}
                aria-valuemin={0}
                aria-valuemax={branch.maxPower}
                aria-valuenow={branch.power}
              >
                <span
                  style={{
                    width: `${percent(branch.power, branch.maxPower)}%`,
                  }}
                />
              </div>
            </li>
          ))}
      </ul>
    </section>
  )
}
