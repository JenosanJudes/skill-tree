import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { HOVER_DELAY_MS } from './useHoverCard'
import { computeLayout } from '../layout/computeLayout'
import { TreeProvider } from '../store/TreeContext'
import { makeTestTree } from '../store/testTree'
import { SkillTreeView } from './SkillTreeView'

function renderTree(
  selectedId: string | null = null,
  onSelect = vi.fn(),
  tree = makeTestTree(),
) {
  return render(
    <TreeProvider initialTree={tree}>
      <SkillTreeView selectedId={selectedId} onSelect={onSelect} />
    </TreeProvider>,
  )
}

describe('SkillTreeView', () => {
  afterEach(cleanup)

  describe('hover-boks', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    function waitForCard() {
      act(() => vi.advanceTimersByTime(HOVER_DELAY_MS))
    }

    it('vises først efter forsinkelsen og skjules, når musen går', () => {
      vi.useFakeTimers()
      renderTree()
      const node = screen.getByRole('button', { name: 'Blad B' })

      fireEvent.mouseEnter(node)
      act(() => vi.advanceTimersByTime(HOVER_DELAY_MS - 1))
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      act(() => vi.advanceTimersByTime(1))
      expect(screen.getByRole('tooltip')).toHaveTextContent('Blad B')

      fireEvent.mouseLeave(node)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })

    it('vises ikke, hvis musen går, før tiden er gået', () => {
      vi.useFakeTimers()
      renderTree()
      const node = screen.getByRole('button', { name: 'Blad B' })
      fireEvent.mouseEnter(node)
      fireEvent.mouseLeave(node)
      waitForCard()
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })

    it('vises ved fokus med tastaturet og skjules ved blur', () => {
      vi.useFakeTimers()
      renderTree()
      const node = screen.getByRole('button', { name: 'Dyb' })
      fireEvent.focus(node)
      waitForCard()
      expect(screen.getByRole('tooltip')).toHaveTextContent('Dyb')
      fireEvent.blur(node)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })

    it('viser niveau, beskrivelse og noter', () => {
      vi.useFakeTimers()
      const tree = makeTestTree()
      const leaf = tree.root.children[0].children[1] // Blad B, niveau 2
      leaf.description = 'Kan det meste'
      leaf.notes = 'Linje 1\nLinje 2'
      renderTree(null, vi.fn(), tree)

      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Blad B' }))
      waitForCard()

      const card = screen.getByRole('tooltip')
      expect(
        within(card).getByRole('img', { name: 'Niveau 2 af 5' }),
      ).toBeInTheDocument()
      expect(card.querySelectorAll('.level-dot-small.filled')).toHaveLength(2)
      expect(card).toHaveTextContent('Kan det meste')
      expect(card).toHaveTextContent('Linje 1')
    })

    it('udelader tomme felter og cirkler på en hovedgren', () => {
      vi.useFakeTimers()
      renderTree()
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Hovedgren' }))
      waitForCard()

      const card = screen.getByRole('tooltip')
      expect(within(card).queryByRole('img')).not.toBeInTheDocument()
      expect(card.querySelectorAll('p')).toHaveLength(1) // kun navnet
    })

    it('viser "Ikke låst op" for niveau 0', () => {
      vi.useFakeTimers()
      renderTree()
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Dyb' }))
      waitForCard()
      expect(
        screen.getByRole('img', { name: 'Ikke låst op' }),
      ).toBeInTheDocument()
    })

    it('vises ikke for den valgte node', () => {
      vi.useFakeTimers()
      renderTree('leaf-a')
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Blad A' }))
      waitForCard()
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })

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

  it('har knapperne før noderne i Tab-rækkefølgen', () => {
    const { container } = renderTree()
    const focusable = container.querySelectorAll('button, [tabindex="0"]')
    expect(focusable[0]).toHaveTextContent('Vis alt')
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
    // Glorierne er også cirkler, men tælles ikke med her.
    expect(
      container.querySelectorAll('[data-node-id] circle:not(.node-glow)'),
    ).toHaveLength(5)
  })

  describe('glød', () => {
    const glowOf = (container: HTMLElement, id: string) =>
      container.querySelector(`[data-node-id="${id}"] .node-glow`)

    it('gløder på niveau 1 og højere, men ikke på niveau 0', () => {
      const { container } = renderTree()
      expect(glowOf(container, 'leaf-a')).not.toBeNull() // niveau 1
      expect(glowOf(container, 'deep')).toBeNull() // niveau 0
    })

    it('gløder stærkere på et højere niveau', () => {
      const { container } = renderTree()
      const opacity = (id: string) =>
        Number(glowOf(container, id)?.getAttribute('opacity'))
      expect(opacity('leaf-b')).toBeGreaterThan(opacity('leaf-a')) // 2 > 1
    })

    it('bruger grenens farve og glød-filteret', () => {
      const { container } = renderTree()
      const glow = glowOf(container, 'leaf-a')
      expect(glow).toHaveAttribute('fill', '#ff0000')
      expect(glow).toHaveAttribute('filter', 'url(#node-glow)')
      expect(container.querySelector('filter#node-glow')).not.toBeNull()
    })
  })

  describe('baggrundsbillede', () => {
    function renderWithImage(backgroundUrl: string | null) {
      return render(
        <TreeProvider initialTree={makeTestTree()}>
          <SkillTreeView
            selectedId={null}
            onSelect={vi.fn()}
            backgroundUrl={backgroundUrl}
          />
        </TreeProvider>,
      )
    }

    it('viser billedet og skjuler prikkerne', () => {
      const { container } = renderWithImage('blob:billede')
      const wrapper = container.querySelector('.tree-wrapper')
      expect(wrapper).toHaveClass('has-image')
      expect(wrapper?.getAttribute('style')).toContain('blob:billede')
      expect(container.querySelector('pattern')).toBeNull()
    })

    it('viser prikkerne uden billede', () => {
      const { container } = renderWithImage(null)
      expect(container.querySelector('.tree-wrapper')).not.toHaveClass(
        'has-image',
      )
      expect(container.querySelector('pattern')).not.toBeNull()
    })
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
