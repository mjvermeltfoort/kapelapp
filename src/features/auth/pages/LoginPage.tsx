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
  const redirectTo = searchParams.get('redirectTo') || '/bands'

  async function handleGoogleLogin() {
    if (!isConfigured) {
      setError('Supabase is nog niet geconfigureerd. Vul eerst .env in.')
      return
    }

    setError(null)
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('redirectTo', redirectTo)

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    })

    if (authError) {
      setError(authError.message)
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

    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('redirectTo', redirectTo)

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl.toString() },
    })

    if (otpError) {
      setError(otpError.message)
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
          <p role="alert">Supabase-config ontbreekt. Zet `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY`.</p>
        ) : null}

        <button type="button" onClick={() => void handleGoogleLogin()}>
          Inloggen met Google
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
          <button type="submit">Stuur eenmalige code</button>
        </form>

        {message ? <p>{message}</p> : null}
        {error ? <p role="alert">{error}</p> : null}
      </PageCard>
    </main>
  )
}
