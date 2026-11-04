const SPACING = 40
const DOT_RADIUS = 1.2
const DOT_COLOR = '#2b3340'
// Stort nok til, at kanten aldrig kommer til syne, selv når man panorerer.
const EXTENT = 100000

type TreeBackgroundProps = {
  /** Samme transform som træet, så prikkerne flytter og zoomer med. */
  transform: string
}

/** Fint prikmønster bag træet. Giver en fornemmelse af rum og bevægelse. */
export function TreeBackground({ transform }: TreeBackgroundProps) {
  return (
    <>
      <defs>
        <pattern
          id="dot-grid"
          width={SPACING}
          height={SPACING}
          patternUnits="userSpaceOnUse"
          patternTransform={transform}
        >
          <circle
            cx={SPACING / 2}
            cy={SPACING / 2}
            r={DOT_RADIUS}
            fill={DOT_COLOR}
          />
        </pattern>
      </defs>
      <rect
        x={-EXTENT}
        y={-EXTENT}
        width={2 * EXTENT}
        height={2 * EXTENT}
        fill="url(#dot-grid)"
      />
    </>
  )
}
