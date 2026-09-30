import type { ReactNode } from 'react'
import { LoadingState } from './LoadingState'
import './SplashScreen.css'

type SplashScreenProps = {
  message?: string
  action?: ReactNode
}

export function SplashScreen({ message = 'Kapel App wordt geladen…', action }: SplashScreenProps) {
  return (
    <div className="splash-screen" role="status" aria-live="polite">
      <img src="/logo-v2.png" alt="" className="splash-screen__logo" />
      {action ? <p>{message}</p> : <LoadingState>{message}</LoadingState>}
      {action}
    </div>
  )
}
