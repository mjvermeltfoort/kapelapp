import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PageCard } from './PageCard'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

afterEach(cleanup)

describe('PageCard', () => {
  it('replaces the current route with the configured back destination', () => {
    navigate.mockReset()
    render(<PageCard title="Test" backTo="/performances" />)

    fireEvent.click(screen.getByRole('button', { name: 'Terug' }))

    expect(navigate).toHaveBeenCalledWith('/performances', {
      replace: true,
    })
  })
})
