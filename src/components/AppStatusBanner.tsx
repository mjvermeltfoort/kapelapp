import { useSyncExternalStore } from 'react'
import { applyAppUpdate, isAppUpdateAvailable, subscribeToAppUpdate } from '../lib/appUpdate'
import { useOnlineStatus } from '../lib/useOnlineStatus'
import './AppStatusBanner.css'

export function AppStatusBanner() {
  const isOnline = useOnlineStatus()
  const isUpdateAvailable = useSyncExternalStore(subscribeToAppUpdate, isAppUpdateAvailable, () => false)

  if (!isOnline) {
    return (
      <div className="app-status-banner app-status-banner--offline" role="status">
        Je bent offline. Je ziet de laatst geladen gegevens; wijzigingen opslaan kan pas weer met verbinding.
      </div>
    )
  }

  if (isUpdateAvailable) {
    return (
      <div className="app-status-banner" role="status">
        <span>Er is een nieuwe versie beschikbaar.</span>
        <button type="button" className="app-status-banner__button" onClick={() => void applyAppUpdate()}>
          Herladen
        </button>
      </div>
    )
  }

  return null
}
