import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PerformanceForm } from './PerformanceForm'

const initialValues = {
  title: 'Zomeravondconcert',
  description: 'Buitenoptreden',
  performanceDate: '2026-08-12',
  startTime: '20:00',
  endTime: '22:00',
  gatherTime: '19:15',
  location: 'Markt',
  mapUrl: '',
  responseDeadline: '',
  status: 'draft' as const,
}

afterEach(() => {
  cleanup()
})

describe('PerformanceForm', () => {
  it('shows create actions without status select', () => {
    render(<PerformanceForm mode="create" initialValues={initialValues} onSubmit={vi.fn()} />)

    expect(screen.queryByText('Status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Opslaan als concept' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publiceren' })).toBeInTheDocument()
  })

  it('submits draft when draft button clicked in create mode', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<PerformanceForm mode="create" initialValues={initialValues} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Opslaan als concept' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        ...initialValues,
        status: 'draft',
      })
    })
  })

  it('submits published when publish button clicked in create mode', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<PerformanceForm mode="create" initialValues={initialValues} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Publiceren' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        ...initialValues,
        status: 'published',
      })
    })
  })

  it('shows status select and submit label in edit mode', () => {
    render(
      <PerformanceForm
        mode="edit"
        submitLabel="Wijzigingen opslaan"
        initialValues={{ ...initialValues, status: 'published' }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Wijzigingen opslaan' })).toBeInTheDocument()
  })
})
