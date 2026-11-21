import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TreeProvider } from '../store/TreeContext'
import { makeTestTree } from '../store/testTree'
import { useTree } from '../store/useTree'
import { PowerMeter } from './PowerMeter'

function RaiseButton() {
  const { dispatch } = useTree()
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'setLevel', id: 'deep', level: 5 })}
    >
      Hæv
    </button>
  )
}

describe('PowerMeter', () => {
  afterEach(cleanup)

  it('viser samlet kraft, titel og en bjælke pr. hovedgren', () => {
    render(
      <TreeProvider initialTree={makeTestTree()}>
        <PowerMeter />
      </TreeProvider>,
    )
    const total = screen.getByRole('progressbar', { name: 'Samlet kraft' })
    expect(total).toHaveAttribute('aria-valuenow', '3')
    expect(total).toHaveAttribute('aria-valuemax', '15')
    expect(screen.getByText('Lærling')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: 'Hovedgren' }),
    ).toBeInTheDocument()
  })

  it('følger med, når et niveau ændres', () => {
    render(
      <TreeProvider initialTree={makeTestTree()}>
        <PowerMeter />
        <RaiseButton />
      </TreeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Hæv' }))
    expect(
      screen.getByRole('progressbar', { name: 'Samlet kraft' }),
    ).toHaveAttribute('aria-valuenow', '8')
    expect(screen.getByText('Øvet')).toBeInTheDocument()
  })

  it('vises ikke for et træ uden færdigheder', () => {
    render(
      <TreeProvider
        initialTree={{
          formatVersion: 1,
          root: { id: 'root', name: 'Rod', children: [] },
        }}
      >
        <PowerMeter />
      </TreeProvider>,
    )
    expect(screen.queryByLabelText('Kraft')).not.toBeInTheDocument()
  })
})
