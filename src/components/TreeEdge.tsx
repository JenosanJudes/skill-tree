import type { CSSProperties } from 'react'
import type { LayoutLink } from '../layout/computeLayout'
import { DEFAULT_BRANCH_COLOR } from '../store/treeReducer'

type TreeEdgeProps = {
  link: LayoutLink
}

/**
 * En forbindelse mellem forælder og barn, i barnets grenfarve. Er barnet
 * låst op (niveau 1 eller højere, eller en hovedgren), løber der lys langs
 * stregen fra forælder mod barn: en ekstra, stiplet streg oven på, som CSS
 * flytter (se .edge-flow i index.css). Jo højere niveau, jo hurtigere.
 */
export function TreeEdge({ link }: TreeEdgeProps) {
  const color = link.color ?? DEFAULT_BRANCH_COLOR
  const level = link.level ?? 0
  const unlocked = link.kind !== 'skill' || level > 0
  // Sekunder for én omgang. Hovedgrene får en rolig mellemfart.
  const duration = link.kind === 'skill' ? 3.4 - level * 0.4 : 2.4

  return (
    <>
      <path
        d={link.path}
        data-link-id={link.id}
        fill="none"
        stroke={color}
        strokeOpacity={unlocked ? 0.45 : 0.25}
        strokeWidth={2}
        strokeDasharray={unlocked ? undefined : '3 6'}
      />
      {unlocked && (
        <path
          className="edge-flow"
          d={link.path}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ '--flow-duration': `${duration}s` } as CSSProperties}
        />
      )}
    </>
  )
}
