import { Link, useSearchParams } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'

export function OtpPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')

  return (
    <main className="auth-page">
      <PageCard
        title="Controleer je e-mail"
        description={
          email
            ? `We hebben een inloglink gestuurd naar ${email}. Open de link in dezelfde browser om verder te gaan.`
            : 'We hebben een inloglink gestuurd. Open de link in dezelfde browser om verder te gaan.'
        }
      >
        <Link to="/login">Terug naar inloggen</Link>
      </PageCard>
    </main>
  )
}
