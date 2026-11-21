import type { SkillNode } from '../types/skillTree'

/** Det højeste niveau, en færdighed kan have. */
export const MAX_LEVEL = 5

export type BranchStats = {
  id: string
  name: string
  color?: string
  /** Summen af niveauerne i grenen. */
  power: number
  /** Hvad summen ville være, hvis alt i grenen var mestret. */
  maxPower: number
}

export type TreeStats = {
  power: number
  maxPower: number
  branches: BranchStats[]
}

/** Alle noder under `node`, uanset dybde (ikke noden selv). */
function descendants(node: SkillNode): SkillNode[] {
  return node.children.flatMap((child) => [child, ...descendants(child)])
}

/**
 * Træets "kraft": summen af alle niveauer, samlet og pr. hovedgren. Tallene
 * regnes ud hver gang og gemmes ikke i træet, så de aldrig kan blive
 * forkerte, og eksportfilerne er uændrede. Ren funktion.
 */
export function treeStats(root: SkillNode): TreeStats {
  const branches = root.children.map((branch) => {
    const skills = descendants(branch)
    return {
      id: branch.id,
      name: branch.name,
      color: branch.color,
      power: skills.reduce((sum, skill) => sum + (skill.level ?? 0), 0),
      maxPower: skills.length * MAX_LEVEL,
    }
  })
  return {
    power: branches.reduce((sum, branch) => sum + branch.power, 0),
    maxPower: branches.reduce((sum, branch) => sum + branch.maxPower, 0),
    branches,
  }
}

/** Titler efter, hvor stor en del af den mulige kraft der er nået. */
const RANKS = [
  { from: 0.8, title: 'Mester' },
  { from: 0.6, title: 'Ekspert' },
  { from: 0.4, title: 'Øvet' },
  { from: 0.2, title: 'Lærling' },
  { from: 0, title: 'Novice' },
]

export function rankFor(power: number, maxPower: number): string {
  const share = maxPower > 0 ? power / maxPower : 0
  return RANKS.find((rank) => share >= rank.from)?.title ?? 'Novice'
}
