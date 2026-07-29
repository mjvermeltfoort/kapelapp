import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PerformanceResponseForm } from './PerformanceResponseForm'

afterEach(() => {
  cleanup()
})

describe('PerformanceResponseForm', () => {
  it('clearly shows that a response is still required', () => {
    render(<PerformanceResponseForm currentResponse={null} onSubmit={vi.fn()} />)

    expect(screen.getByText(/je hebt nog geen reactie gegeven/i)).toBeVisible()
    expect(screen.getByRole('radio', { name: 'Ja' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Misschien' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Nee' })).not.toBeChecked()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kies eerst een reactie' })).toBeDisabled()
  })

  it('enables saving after choosing a response', () => {
    render(<PerformanceResponseForm currentResponse={null} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Ja' }))

    expect(screen.getByRole('radio', { name: 'Ja' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Reactie opslaan' })).toBeEnabled()
    expect(screen.queryByText(/je hebt nog geen reactie gegeven/i)).not.toBeInTheDocument()
  })
})
