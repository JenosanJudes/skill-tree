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
import { useTree } from '../store/useTree'
import type { Level } from '../types/skillTree'
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
    // Glorier og trykflader er også cirkler, men tælles ikke med her.
    expect(
      container.querySelectorAll(
        '[data-node-id] > circle:not(.node-glow):not(.node-hit):not(.level-flash)',
      ),
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

    it('viser billedet og skjuler stjernehimlen', () => {
      const { container } = renderWithImage('blob:billede')
      const wrapper = container.querySelector('.tree-wrapper')
      expect(wrapper).toHaveClass('has-image')
      expect(wrapper?.getAttribute('style')).toContain('blob:billede')
      expect(container.querySelector('.star-field')).toBeNull()
    })

    it('viser stjernehimlen uden billede', () => {
      const { container } = renderWithImage(null)
      expect(container.querySelector('.tree-wrapper')).not.toHaveClass(
        'has-image',
      )
      expect(container.querySelector('.star-field')).not.toBeNull()
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

  it('flyver ind på en hovedgren ved klik og hjem igen med "Vis alt"', () => {
    const onSelect = vi.fn()
    // To hovedgrene, så den ene gren fylder mindre end hele træet.
    const tree = makeTestTree()
    tree.root.children.push({
      id: 'other',
      name: 'Anden gren',
      color: '#00ff00',
      children: [{ id: 'other-leaf', name: 'Blad C', level: 3, children: [] }],
    })
    const { container } = renderTree(null, onSelect, tree)
    const camera = () =>
      container.querySelector('svg > g')?.getAttribute('transform')

    fireEvent.click(screen.getByRole('button', { name: 'Hovedgren' }))
    expect(onSelect).toHaveBeenCalledWith('branch')
    // Grenen er mindre end hele træet, så kameraet har zoomet ind.
    expect(camera()).not.toBe('translate(0,0) scale(1)')

    fireEvent.click(screen.getByRole('button', { name: 'Vis alt' }))
    expect(camera()).toBe('translate(0,0) scale(1)')
  })

  it('flytter ikke kameraet ved klik på en undergren', () => {
    const { container } = renderTree()
    fireEvent.click(screen.getByRole('button', { name: 'Blad A' }))
    expect(container.querySelector('svg > g')).toHaveAttribute(
      'transform',
      'translate(0,0) scale(1)',
    )
  })

  it('giver hver node en trykflade, der er større end cirklen', () => {
    const { container } = renderTree()
    expect(container.querySelectorAll('.node-hit')).toHaveLength(5)
  })

  it('viser alle navne, når der ikke er zoomet ud', () => {
    renderTree()
    expect(screen.getByRole('group', { name: 'Skill tree' })).toHaveAttribute(
      'data-detail',
      'near',
    )
  })

  it('tegner en stjernehimmel i to lag bag træet', () => {
    const { container } = renderTree()
    const layers = container.querySelectorAll<HTMLElement>('.star-field .stars')
    expect(layers).toHaveLength(2)
    expect(layers[0].style.backgroundPosition).toBe('0px 0px')
  })

  describe('niveauring', () => {
    const segments = (container: HTMLElement, id: string, filled = '') =>
      container.querySelectorAll(
        `[data-node-id="${id}"] .level-segment${filled}`,
      )

    it('har fem stykker om hver undergren, farvet op til niveauet', () => {
      const { container } = renderTree()
      expect(segments(container, 'leaf-b')).toHaveLength(5)
      expect(segments(container, 'leaf-b', '.filled')).toHaveLength(2)
      expect(segments(container, 'deep', '.filled')).toHaveLength(0)
    })

    it('findes ikke på stamme og hovedgrene', () => {
      const { container } = renderTree()
      expect(segments(container, 'root')).toHaveLength(0)
      expect(segments(container, 'branch')).toHaveLength(0)
    })
  })

  describe('glimt ved nyt niveau', () => {
    function LevelButton({ level }: { level: Level }) {
      const { dispatch } = useTree()
      return (
        <button
          type="button"
          onClick={() => dispatch({ type: 'setLevel', id: 'leaf-b', level })}
        >
          Sæt niveau {level}
        </button>
      )
    }

    function renderWithButton(level: Level) {
      return render(
        <TreeProvider initialTree={makeTestTree()}>
          <SkillTreeView selectedId={null} onSelect={vi.fn()} />
          <LevelButton level={level} />
        </TreeProvider>,
      )
    }

    const burstOf = (container: HTMLElement) =>
      container.querySelector('[data-node-id="leaf-b"] .level-burst')

    it('vises, når niveauet stiger', () => {
      const { container } = renderWithButton(4) // Blad B er på niveau 2
      expect(burstOf(container)).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Sæt niveau 4' }))
      expect(burstOf(container)).not.toBeNull()
    })

    it('vises ikke, når niveauet falder', () => {
      const { container } = renderWithButton(1)
      fireEvent.click(screen.getByRole('button', { name: 'Sæt niveau 1' }))
      expect(burstOf(container)).toBeNull()
    })
  })

  it('lader lys løbe langs forbindelser til oplåste noder', () => {
    const { container } = renderTree()
    // Stamme → hovedgren, Blad A (niveau 1) og Blad B (niveau 2), men ikke
    // Dyb (niveau 0).
    expect(container.querySelectorAll('.edge-flow')).toHaveLength(3)
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
