import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { PageCard } from './PageCard'

afterEach(cleanup)

describe('PageCard', () => {
  it('replaces the current route with the configured back destination', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: <PageCard title="Test" backTo="/performances" />,
        },
      ],
      {
        initialEntries: ['/previous-page', '/current-page'],
        initialIndex: 1,
      },
    )
    render(<RouterProvider router={router} />)

    fireEvent.click(screen.getByRole('button', { name: 'Terug' }))

    expect(router.state.location.pathname).toBe('/performances')

    await router.navigate(-1)
    expect(router.state.location.pathname).toBe('/previous-page')
  })
})
