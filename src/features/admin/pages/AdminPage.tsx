import { Navigate, useSearchParams } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'
import { TabLink, Tabs } from '../../../components/Tabs'
import { isAdminRole } from '../../../lib/roles'
import { useAuth } from '../../auth/hooks/useAuth'
import { BandSettingsPage } from '../../bands/pages/BandSettingsPage'
import { useBand } from '../../bands/hooks/useBand'
import { MembersPage } from '../../members/pages/MembersPage'

const tabs = [
  { key: 'band', label: 'Kapel' },
  { key: 'members', label: 'Leden' },
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

  const canManageAdmin = profile?.is_superadmin || isAdminRole(activeMembership?.role)

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
      <Tabs aria-label="Beheeronderdelen">
        {tabs.map((tab) => (
          <TabLink
            key={tab.key}
            to={`/admin?tab=${tab.key}`}
            replace={activeTab === tab.key}
            isActive={tab.key === activeTab}
          >
            {tab.label}
          </TabLink>
        ))}
      </Tabs>

      {activeTab === 'members' ? <MembersPage /> : null}
      {activeTab === 'band' ? <BandSettingsPage /> : null}
    </div>
  )
}
