import { STAR_LAYERS } from '../layout/stars'

type StarFieldProps = {
  /** Kameraets forskydning i skærm-pixels. */
  panX: number
  panY: number
}

/**
 * Stjernehimlen bag træet. Hvert lag er en almindelig <div> med et gentaget
 * baggrundsbillede; når kameraet flytter sig, flytter vi kun billedets
 * startpunkt (background-position). Det er billigt for browseren og kræver
 * ingen tegnekode.
 */
export function StarField({ panX, panY }: StarFieldProps) {
  return (
    <div className="star-field" aria-hidden="true">
      {STAR_LAYERS.map((layer, index) => (
        <div
          key={index}
          className="stars"
          style={{
            backgroundImage: layer.image,
            backgroundSize: `${layer.size}px ${layer.size}px`,
            backgroundPosition: `${Math.round(panX * layer.parallax)}px ${Math.round(panY * layer.parallax)}px`,
            // De to lag blinker i hver sin takt.
            animationDuration: `${6 + index * 3}s`,
          }}
        />
      ))}
    </div>
  )
}
