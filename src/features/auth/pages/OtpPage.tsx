import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { FormField, Input } from '../../../components/FormField'
import { PageCard } from '../../../components/PageCard'
import { supabase } from '../../../lib/supabase/client'

export function OtpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const redirectTo = searchParams.get('redirectTo') || '/'
  const [token, setToken] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email) {
      setError('Geen e-mailadres gevonden. Vraag eerst een nieuwe code aan.')
      return
    }

    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: 'email',
    })

    if (verifyError) {
      setError(verifyError.message)
      setIsSubmitting(false)
      return
    }

    navigate(redirectTo, { replace: true })
  }

  async function handleResend() {
    if (!email) {
      setError('Geen e-mailadres gevonden. Ga terug en probeer opnieuw.')
      return
    }

    setError(null)
    setMessage(null)
    setIsResending(true)

    const { error: resendError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (resendError) {
      setError(resendError.message)
      setIsResending(false)
      return
    }

    setMessage('Nieuwe verificatiecode verzonden.')
    setIsResending(false)
  }

  return (
    <main className="auth-page">
      <PageCard
        title="Voer je code in"
        description={
          email
            ? `Vul de verificatiecode in die is gestuurd naar ${email}.`
            : 'Vul de verificatiecode uit je e-mail in.'
        }
        backTo="/login"
      >
        <form onSubmit={(event) => void handleSubmit(event)} className="performance-form">
          <FormField label="Verificatiecode">
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
              placeholder="123456"
            />
          </FormField>

          <Button type="submit" disabled={isSubmitting || isResending} fullWidth>
            {isSubmitting ? 'Code wordt gecontroleerd…' : 'Inloggen'}
          </Button>

          <Button type="button" variant="secondary" onClick={() => void handleResend()} disabled={isSubmitting || isResending} fullWidth>
            {isResending ? 'Code wordt opnieuw verstuurd…' : 'Code opnieuw sturen'}
          </Button>
        </form>

        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
      </PageCard>
    </main>
  )
}
