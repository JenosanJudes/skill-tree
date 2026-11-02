/** Niveau for en færdighed: 0 = ikke låst op, 5 = mestret. */
export type Level = 0 | 1 | 2 | 3 | 4 | 5

export type SkillLink = {
  title: string
  url: string
}

export type SkillNode = {
  /** Unikt, fx genereret med crypto.randomUUID(). */
  id: string
  name: string
  description?: string
  /** Udelades på stamme og hovedgrene. */
  level?: Level
  /** Kun på hovedgrene; undergrene arver farven. */
  color?: string
  notes?: string
  links?: SkillLink[]
  children: SkillNode[]
}

export type SkillTree = {
  /** Gør det muligt at ændre formatet senere. */
  formatVersion: 1
  root: SkillNode
}
