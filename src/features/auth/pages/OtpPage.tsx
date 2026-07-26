import { useSearchParams } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'

export function OtpPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')

  return (
    <main className="auth-page">
      <PageCard
        title="OTP-code invoeren"
        description="MVP-startpunt: Supabase magic link flow is aangesloten. Codeverificatie kan hier later worden toegevoegd als aparte UX."
      >
        <p>{email ? `Controleer mailbox van ${email}.` : 'Controleer je mailbox.'}</p>
        <p>Na openen van de link kom je terug op de callback-route.</p>
      </PageCard>
    </main>
  )
}
