import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'
import { supabase } from '../../../lib/supabase/client'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const redirectTo = searchParams.get('redirectTo') || '/bands'

    void supabase.auth.getSession().then(({ error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message)
        return
      }

      navigate(redirectTo, { replace: true })
    })
  }, [navigate, searchParams])

  return (
    <main className="auth-page">
      <PageCard
        title="OAuth-callback en sessieherstel"
        description="Sessie wordt afgerond en daarna word je doorgestuurd."
      >
        {error ? <p role="alert">{error}</p> : <p>Bezig met afronden van login…</p>}
      </PageCard>
    </main>
  )
}
