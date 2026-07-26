import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../../auth/hooks/useAuth'
import { BandSettingsPage } from '../../bands/pages/BandSettingsPage'
import { useBand } from '../../bands/hooks/useBand'
import { InvitesPage } from '../../invites/pages/InvitesPage'
import { MembersPage } from '../../members/pages/MembersPage'

const tabs = [
  { key: 'band', label: 'Kapel' },
  { key: 'members', label: 'Leden' },
  { key: 'invites', label: 'Uitnodigingen' },
] as const

type TabKey = (typeof tabs)[number]['key']

export function AdminPage() {
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()
  const { activeMembership } = useBand()
  const requestedTab = searchParams.get('tab')
  const activeTab = tabs.some((tab) => tab.key === requestedTab)
    ? (requestedTab as TabKey)
    : 'band'

  const canManageAdmin = profile?.is_superadmin || ['admin', 'owner'].includes(activeMembership?.role ?? '')

  if (!canManageAdmin) {
    return <Navigate to="/performances" replace />
  }

  if (!activeMembership && activeTab !== 'members') {
    return (
      <PageCard title="Beheer">
        <p>Kies eerst een actieve kapel.</p>
      </PageCard>
    )
  }

  return (
    <div className="page-grid">
      <nav className="tab-nav" aria-label="Beheeronderdelen">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={`/admin?tab=${tab.key}`}
            replace={activeTab === tab.key}
            className={tab.key === activeTab ? 'tab-link tab-link--active' : 'tab-link'}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {activeTab === 'members' ? <MembersPage /> : null}
      {activeTab === 'invites' ? <InvitesPage /> : null}
      {activeTab === 'band' ? <BandSettingsPage /> : null}
    </div>
  )
}
