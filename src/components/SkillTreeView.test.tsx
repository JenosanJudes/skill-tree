import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
    expect(container.querySelectorAll('[data-node-id] circle')).toHaveLength(5)
  })

  it('tegner én forbindelse pr. node undtagen stammen', () => {
    const { container } = renderTree()
    expect(container.querySelectorAll('path[data-link-id]')).toHaveLength(4)
  })

  it('starter uden forskydning og zoom', () => {
    const { container } = renderTree()
    expect(container.querySelector('svg > g')).toHaveAttribute(
      'transform',
      'translate(0,0) scale(1)',
    )
  })

  it('har en "Vis alt"-knap, der kan trykkes uden fejl', () => {
    const { container } = renderTree()
    fireEvent.click(screen.getByRole('button', { name: 'Vis alt' }))
    expect(container.querySelector('svg > g')).toHaveAttribute(
      'transform',
      'translate(0,0) scale(1)',
    )
  })

  it('tegner et prikmønster, der følger træets transform', () => {
    const { container } = renderTree()
    expect(container.querySelector('pattern')).toHaveAttribute(
      'patternTransform',
      'translate(0,0) scale(1)',
    )
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
