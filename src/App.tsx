import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { AppStatusBanner } from './components/AppStatusBanner'

function App() {
  return (
    <>
      <AppStatusBanner />
      <RouterProvider router={router} />
    </>
  )
}

export default App
