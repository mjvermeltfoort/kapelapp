import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemberCard } from './MemberCard'

describe('MemberCard', () => {
  const person = {
    user_id: 'user-1',
    display_name: 'Jan Jansen',
    instrument: 'Trompet',
    reason: 'Werk',
    responded_at: '2026-07-27T10:30:00.000Z',
  }

  it('renders static card when no reason should be shown', () => {
    render(<MemberCard person={person} />)

    expect(screen.getByText('Jan Jansen')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText('Reden: Werk')).not.toBeInTheDocument()
  })

  it('toggles details when reason is available', () => {
    render(<MemberCard person={person} showReason />)

    const trigger = screen.getByRole('button', { name: /jan jansen/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Reden: Werk')).toBeInTheDocument()
  })

  it('shows no response label when responded_at missing', () => {
    render(
      <MemberCard
        person={{
          ...person,
          responded_at: undefined,
          reason: null,
        }}
      />,
    )

    expect(screen.getByText('Nog niet gereageerd')).toBeInTheDocument()
  })
})
