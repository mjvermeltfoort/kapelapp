import { useSearchParams } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'

export function OtpPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')

  return (
    <main className="auth-page">
      <PageCard title="Controleer je e-mail">
        <p>{email ? `Controleer mailbox van ${email}.` : 'Controleer je mailbox.'}</p>
      </PageCard>
    </main>
  )
}
