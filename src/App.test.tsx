import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('viser skill treet', () => {
    render(<App />)
    expect(screen.getByRole('img', { name: 'Skill tree' })).toBeInTheDocument()
  })
})
