import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { computeLayout } from '../layout/computeLayout'
import { TreeProvider } from '../store/TreeContext'
import { makeTestTree } from '../store/testTree'
import { SkillTreeView } from './SkillTreeView'

function renderTree() {
  return render(
    <TreeProvider initialTree={makeTestTree()}>
      <SkillTreeView />
    </TreeProvider>,
  )
}

describe('SkillTreeView', () => {
  afterEach(cleanup)

  it('viser navnet på alle noder', () => {
    renderTree()
    for (const name of ['Rod', 'Hovedgren', 'Blad A', 'Blad B', 'Dyb']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('tegner én cirkel pr. node', () => {
    const { container } = renderTree()
    expect(container.querySelectorAll('circle')).toHaveLength(5)
  })

  it('tegner én forbindelse pr. node undtagen stammen', () => {
    const { container } = renderTree()
    expect(container.querySelectorAll('path[data-link-id]')).toHaveLength(4)
  })

  it('sætter viewBox ud fra layoutets rammer', () => {
    renderTree()
    const { x, y, width, height } = computeLayout(makeTestTree().root).bounds
    expect(screen.getByRole('img', { name: 'Skill tree' })).toHaveAttribute(
      'viewBox',
      `${x} ${y} ${width} ${height}`,
    )
  })
})
