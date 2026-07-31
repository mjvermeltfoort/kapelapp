import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { FormField, Input } from '../../../components/FormField'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../hooks/useAuth'
import { sanitizeRedirectTarget } from '../../../lib/redirect'
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
  const redirectTo = sanitizeRedirectTarget(searchParams.get('redirectTo'), '/')

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

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (otpError) {
      setError(otpError.message)
      setIsOtpLoading(false)
      return
    }

    setMessage('Verificatiecode verzonden. Controleer je e-mail.')
    navigate(`/otp?email=${encodeURIComponent(email)}&redirectTo=${encodeURIComponent(redirectTo)}`)
    setIsOtpLoading(false)
  }

  return (
    <main className="auth-page">
      <PageCard
        title="Inloggen"
        description="Gebruik Google of een verificatiecode per e-mail."
      >
        {!isConfigured ? (
          <Alert tone="error">
            Supabase-config ontbreekt. Zet `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY`.
          </Alert>
        ) : null}

        <p className="muted-text">
          Gebruik bij voorkeur steeds hetzelfde e-mailadres voor Google en e-mailcodes.
        </p>

        <Button
          type="button"
          onClick={() => void handleGoogleLogin()}
          disabled={isGoogleLoading || isOtpLoading}
          fullWidth
        >
          {isGoogleLoading ? 'Doorsturen naar Google…' : 'Inloggen met Google'}
        </Button>

        <form onSubmit={(event) => void handleOtpRequest(event)} className="performance-form">
          <FormField label="E-mailadres">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="jij@voorbeeld.nl"
            />
          </FormField>
          <Button type="submit" disabled={isGoogleLoading || isOtpLoading} fullWidth>
            {isOtpLoading ? 'Code wordt verstuurd…' : 'Stuur verificatiecode'}
          </Button>
        </form>

        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
      </PageCard>
    </main>
  )
}
