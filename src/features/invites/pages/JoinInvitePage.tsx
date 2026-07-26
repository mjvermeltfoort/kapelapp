import { useParams } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'

export function JoinInvitePage() {
  const { token } = useParams()

  return (
    <main className="auth-page">
      <PageCard
        title="Uitnodiging accepteren"
        description="Publieke joinpagina. Preview- en accept-RPC volgen in volgende implementatiestap."
      >
        <p>Token aanwezig: {token ? 'ja' : 'nee'}</p>
        <p>Doel: preview tonen vóór login, daarna veilige acceptatie via RPC.</p>
      </PageCard>
    </main>
  )
}
