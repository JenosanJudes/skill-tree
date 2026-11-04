import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { computeLayout } from '../layout/computeLayout'
import { TreeProvider } from '../store/TreeContext'
import { makeTestTree } from '../store/testTree'
import { SkillTreeView } from './SkillTreeView'

function renderTree(selectedId: string | null = null, onSelect = vi.fn()) {
  return render(
    <TreeProvider initialTree={makeTestTree()}>
      <SkillTreeView selectedId={selectedId} onSelect={onSelect} />
    </TreeProvider>,
  )
}

describe('SkillTreeView', () => {
  afterEach(cleanup)

  it('vælger en node ved klik', () => {
    const onSelect = vi.fn()
    renderTree(null, onSelect)
    fireEvent.click(screen.getByRole('button', { name: 'Blad A' }))
    expect(onSelect).toHaveBeenCalledWith('leaf-a')
  })

  it('vælger en node med Enter og mellemrum', () => {
    const onSelect = vi.fn()
    renderTree(null, onSelect)
    const node = screen.getByRole('button', { name: 'Dyb' })
    fireEvent.keyDown(node, { key: 'Enter' })
    fireEvent.keyDown(node, { key: ' ' })
    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(onSelect).toHaveBeenCalledWith('deep')
  })

  it('kan nås med Tab, fordi noderne har tabIndex', () => {
    renderTree()
    expect(screen.getByRole('button', { name: 'Rod' })).toHaveAttribute(
      'tabindex',
      '0',
    )
  })

  it('fravælger ved klik ved siden af noderne', () => {
    const onSelect = vi.fn()
    renderTree('leaf-a', onSelect)
    fireEvent.click(screen.getByRole('group', { name: 'Skill tree' }))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('markerer den valgte node med en ring', () => {
    const { container } = renderTree('leaf-b')
    expect(screen.getByRole('button', { name: 'Blad B' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(container.querySelectorAll('.selection-ring')).toHaveLength(1)
    expect(
      container.querySelector('[data-node-id="leaf-b"] .selection-ring'),
    ).not.toBeNull()
  })

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
    expect(screen.getByRole('group', { name: 'Skill tree' })).toHaveAttribute(
      'viewBox',
      `${x} ${y} ${width} ${height}`,
    )
  })
})
