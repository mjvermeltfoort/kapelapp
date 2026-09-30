import { LoadingState } from './LoadingState'
import './SplashScreen.css'

export function SplashScreen({ message = 'Kapel App wordt geladen…' }: { message?: string }) {
  return (
    <div className="splash-screen" role="status" aria-live="polite">
      <img src="/logo-v2.png" alt="" className="splash-screen__logo" />
      <LoadingState>{message}</LoadingState>
    </div>
  )
}
