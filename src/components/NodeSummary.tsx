import type { SkillNode } from '../types/skillTree'
import { LevelDots } from './LevelDots'

type NodeSummaryProps = {
  node: SkillNode
  /** Farven til niveau-cirklerne. Udelades den, vises niveauet ikke. */
  levelColor?: string
}

/**
 * Navn, niveau, beskrivelse og noter, kun til læsning. Bruges både i
 * hover-boksen (mus) og i bundarket (telefon), så de to altid viser det samme.
 */
export function NodeSummary({ node, levelColor }: NodeSummaryProps) {
  return (
    <>
      <p className="summary-name">{node.name}</p>
      {levelColor && <LevelDots level={node.level ?? 0} color={levelColor} />}
      {node.description && (
        <p className="summary-description">{node.description}</p>
      )}
      {node.notes && <p className="summary-notes">{node.notes}</p>}
    </>
  )
}
