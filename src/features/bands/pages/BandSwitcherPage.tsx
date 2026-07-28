import { Link } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { EmptyState } from '../../../components/EmptyState'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../hooks/useBand'

export function BandSwitcherPage() {
  const { activeBandId, memberships, isLoading, error } = useBand()
  const activeMembership = memberships.find((membership) => membership.band_id === activeBandId)
  const canManageBand = ['admin', 'owner'].includes(activeMembership?.role ?? '')

  return (
    <div className="page-grid">
      <PageCard title="Mijn kapellen" description="Je wisselt van actieve kapel via het kapelmenu bovenin.">
        <div className="band-overview-header">
          <Badge tone="brand">{memberships.length} kapel{memberships.length === 1 ? '' : 'len'}</Badge>
        </div>

        {isLoading ? <LoadingState>Kapellen worden geladen…</LoadingState> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}

        {!isLoading && !memberships.length ? (
          <EmptyState>Je bent nog geen lid van een kapel. Vraag een uitnodigingslink aan.</EmptyState>
        ) : null}

        <div className="band-list">
          {memberships.map((membership) => {
            const isActive = membership.band_id === activeBandId

            return (
              <div key={membership.id} className={isActive ? 'band-tile band-tile--active band-tile--enhanced' : 'band-tile band-tile--enhanced'}>
                <div className="band-tile__topline">
                  <strong>{membership.band.name}</strong>
                  <Badge tone={isActive ? 'brand' : 'neutral'}>{isActive ? 'Actief' : membership.role}</Badge>
                </div>
                <span>{membership.band.description ?? 'Geen beschrijving toegevoegd'}</span>
                <div className="band-tile__meta-row">
                  <span>Rol: {membership.role}</span>
                  <span>Instrument: {membership.instrument ?? 'Niet ingevuld'}</span>
                </div>

                {isActive ? (
                  <div className="band-link-grid">
                    <Link to="/performances" className="performance-secondary-link">
                      Ga naar optredens
                    </Link>
                    {canManageBand ? (
                      <Link to="/settings/band" className="performance-secondary-link">
                        Kapelinstellingen
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </PageCard>
    </div>
  )
}
