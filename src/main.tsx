import './lib/installPrompt'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { AppProviders } from './app/providers/AppProviders'
import './index.css'
import { waitForLatestAppVersion } from './lib/appUpdate'

async function startApp() {
  await waitForLatestAppVersion(registerSW)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  )
}

void startApp()
