import type { LayoutLink } from '../layout/computeLayout'

const FALLBACK_COLOR = '#90a4ae'

type TreeEdgeProps = {
  link: LayoutLink
}

/** En forbindelse mellem forælder og barn, i barnets grenfarve. */
export function TreeEdge({ link }: TreeEdgeProps) {
  return (
    <path
      d={link.path}
      data-link-id={link.id}
      fill="none"
      stroke={link.color ?? FALLBACK_COLOR}
      strokeOpacity={0.6}
      strokeWidth={2}
    />
  )
}
