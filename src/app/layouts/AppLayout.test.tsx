import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLayout } from './AppLayout'

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { is_superadmin: false },
  }),
}))

vi.mock('../../features/bands/hooks/useBand', () => ({
  useBand: () => ({
    activeMembership: {
      id: 'membership-1',
      band_id: 'band-1',
      role: 'member',
      band: { id: 'band-1', name: 'De Kneuterkapel' },
    },
    memberships: [
      {
        id: 'membership-1',
        band_id: 'band-1',
        role: 'member',
        band: { id: 'band-1', name: 'De Kneuterkapel' },
      },
    ],
    setActiveBandId: vi.fn(),
  }),
}))

vi.mock('../../lib/installPrompt', () => ({
  clearInstallPrompt: vi.fn(),
  dismissIOSInstall: vi.fn(),
  getInstallPrompt: () => null,
  hasIOSInstallBeenDismissed: () => true,
  isIOSSafari: () => false,
}))

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  })
})

afterEach(() => {
  cleanup()
})

describe('AppLayout band menu', () => {
  it('closes with Escape and restores trigger focus', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    const trigger = screen.getByRole('button', {
      name: /actieve kapel: de kneuterkapel/i,
    })

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('closes when pointer moves outside the menu', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    const trigger = screen.getByRole('button', {
      name: /actieve kapel: de kneuterkapel/i,
    })

    fireEvent.click(trigger)
    fireEvent.pointerDown(document.body)

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('AppLayout navigation', () => {
  it('shows performances and profile once for members, without admin links', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    const navigation = screen.getByRole('navigation', { name: 'Hoofdnavigatie' })

    expect(navigation).toHaveTextContent('Optredens')
    expect(navigation).toHaveTextContent('Profiel')
    expect(navigation).not.toHaveTextContent('Beheer')
    expect(screen.getAllByRole('link', { name: 'Profiel' })).toHaveLength(1)
  })

  it('shows Dutch role labels in the band menu', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /actieve kapel: de kneuterkapel/i }))

    expect(screen.getByRole('button', { name: 'Kies kapel De Kneuterkapel' })).toHaveTextContent('Lid')
  })
})
