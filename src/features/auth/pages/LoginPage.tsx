import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../../../lib/supabase/client'

export function LoginPage() {
  const navigate = useNavigate()
  const { isConfigured } = useAuth()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isOtpLoading, setIsOtpLoading] = useState(false)
  const redirectTo = searchParams.get('redirectTo') || '/bands'

  async function handleGoogleLogin() {
    if (!isConfigured) {
      setError('Supabase is nog niet geconfigureerd. Vul eerst .env in.')
      return
    }

    setError(null)
    setMessage(null)
    setIsGoogleLoading(true)

    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('redirectTo', redirectTo)

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    })

    if (authError) {
      setError(authError.message)
      setIsGoogleLoading(false)
      return
    }
  }

  async function handleOtpRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isConfigured) {
      setError('Supabase is nog niet geconfigureerd. Vul eerst .env in.')
      return
    }

    setError(null)
    setMessage(null)
    setIsOtpLoading(true)

    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('redirectTo', redirectTo)

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl.toString() },
    })

    if (otpError) {
      setError(otpError.message)
      setIsOtpLoading(false)
      return
    }

    setMessage('OTP-link verzonden. Controleer je e-mail.')
    navigate(`/otp?email=${encodeURIComponent(email)}`)
  }

  return (
    <main className="auth-page">
      <PageCard
        title="Inloggen"
        description="Gebruik Google of een eenmalige code per e-mail."
      >
        {!isConfigured ? (
          <p role="alert" className="alert alert--error">
            Supabase-config ontbreekt. Zet `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY`.
          </p>
        ) : null}

        <p className="muted-text">
          Gebruik bij voorkeur steeds hetzelfde e-mailadres voor Google en OTP.
        </p>

        <button
          type="button"
          onClick={() => void handleGoogleLogin()}
          disabled={isGoogleLoading || isOtpLoading}
        >
          {isGoogleLoading ? 'Doorsturen naar Google…' : 'Inloggen met Google'}
        </button>

        <form onSubmit={(event) => void handleOtpRequest(event)}>
          <label>
            E-mailadres
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="jij@voorbeeld.nl"
            />
          </label>
          <button type="submit" disabled={isGoogleLoading || isOtpLoading}>
            {isOtpLoading ? 'Code wordt verstuurd…' : 'Stuur eenmalige code'}
          </button>
        </form>

        {message ? <p className="alert alert--success">{message}</p> : null}
        {error ? <p role="alert" className="alert alert--error">{error}</p> : null}
      </PageCard>
    </main>
  )
}
