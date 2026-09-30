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

  it.each(['Opslaan als concept', 'Publiceren'])('blocks %s when required fields are empty', (button) => {
    const onSubmit = vi.fn()
    render(<PerformanceForm mode="create" initialValues={{ ...initialValues, title: '' }} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: button }))

    expect(screen.getByLabelText('Titel')).toBeInvalid()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('blocks publishing an invalid map URL', () => {
    const onSubmit = vi.fn()
    render(<PerformanceForm mode="create" initialValues={{ ...initialValues, mapUrl: 'geen-url' }} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Publiceren' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('preserves the selected status when editing', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<PerformanceForm mode="edit" submitLabel="Wijzigingen opslaan" initialValues={{ ...initialValues, status: 'cancelled' }} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Wijzigingen opslaan' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ ...initialValues, status: 'cancelled' }))
  })
})
