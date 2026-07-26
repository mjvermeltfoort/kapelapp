import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../../auth/hooks/useAuth'
import type { BandMembership } from '../../bands/api/bands'
import { useBand } from '../../bands/hooks/useBand'
import {
  deactivateBandMember,
  listAllMembers,
  listBandMembers,
  reactivateBandMember,
  setBandMemberRole,
  type BandMemberRecord,
} from '../api/members'

const roleOptions: Array<BandMembership['role']> = ['member', 'planner', 'admin', 'owner']

export function MembersPage() {
  const { profile } = useAuth()
  const { activeMembership } = useBand()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const isSuperadmin = profile?.is_superadmin ?? false
  const canManageMembers = useMemo(
    () => isSuperadmin || ['admin', 'owner'].includes(activeMembership?.role ?? ''),
    [activeMembership?.role, isSuperadmin],
  )

  const membersQuery = useQuery({
    queryKey: isSuperadmin ? ['all-members'] : ['band-members', activeMembership?.band.id],
    queryFn: async () => (isSuperadmin ? listAllMembers() : listBandMembers(activeMembership!.band.id)),
    enabled: Boolean(canManageMembers && (isSuperadmin || activeMembership?.band.id)),
  })

  async function handleRoleChange(member: BandMemberRecord, role: BandMembership['role']) {
    setMessage(null)
    setError(null)
    setPendingKey(`role:${member.user_id}`)

    try {
      await setBandMemberRole({
        bandId: member.band_id,
        userId: member.user_id,
        role,
      })
      setMessage('Rol bijgewerkt.')
      await membersQuery.refetch()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Rol wijzigen mislukt.')
    } finally {
      setPendingKey(null)
    }
  }

  async function handleDeactivate(member: BandMemberRecord) {
    if (!window.confirm(`Weet je zeker dat je ${member.display_name ?? member.email} wilt deactiveren?`)) {
      return
    }

    setMessage(null)
    setError(null)
    setPendingKey(`deactivate:${member.user_id}`)

    try {
      await deactivateBandMember({
        bandId: member.band_id,
        userId: member.user_id,
      })
      setMessage('Lid gedeactiveerd.')
      await membersQuery.refetch()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Deactiveren mislukt.')
    } finally {
      setPendingKey(null)
    }
  }

  async function handleReactivate(member: BandMemberRecord) {
    setMessage(null)
    setError(null)
    setPendingKey(`reactivate:${member.user_id}`)

    try {
      await reactivateBandMember({
        bandId: member.band_id,
        userId: member.user_id,
      })
      setMessage('Lid opnieuw geactiveerd.')
      await membersQuery.refetch()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Heractiveren mislukt.')
    } finally {
      setPendingKey(null)
    }
  }

  if (!activeMembership && !isSuperadmin) {
    return (
      <PageCard title="Leden- en rollenbeheer">
        <p>Kies eerst een actieve kapel.</p>
      </PageCard>
    )
  }

  if (!canManageMembers) {
    return (
      <PageCard title="Leden- en rollenbeheer">
        <p>Je huidige rol heeft geen toegang tot dit scherm.</p>
      </PageCard>
    )
  }

  return (
    <PageCard title={isSuperadmin ? 'Alle leden' : 'Leden- en rollenbeheer'}>
      {membersQuery.isLoading ? <p>Leden worden geladen…</p> : null}
      {membersQuery.error instanceof Error ? <p role="alert" className="alert alert--error">{membersQuery.error.message}</p> : null}
      {message ? <p className="alert alert--success">{message}</p> : null}
      {error ? <p role="alert" className="alert alert--error">{error}</p> : null}

      {!membersQuery.isLoading && !membersQuery.data?.length ? (
        <p className="empty-state">Geen leden gevonden.</p>
      ) : null}

      <div className="stack-sm">
        {membersQuery.data?.map((member) => {
          const isPending = pendingKey?.includes(member.user_id) ?? false
          const canAssignOwner = isSuperadmin || activeMembership?.role === 'owner'
          const roleChoices = canAssignOwner
            ? roleOptions
            : roleOptions.filter((role) => role !== 'owner')
          const canChangeRole = isSuperadmin || canAssignOwner || member.role !== 'owner'

          return (
            <div key={member.membership_id} className="member-card">
              <div>
                <strong>{member.display_name ?? member.email}</strong>
                <p>{member.email}</p>
                <p>Kapel: {member.band_name}</p>
                <p>Instrument: {member.instrument ?? 'Niet ingevuld'}</p>
                <p>
                  Status:{' '}
                  <span className={member.is_active ? 'status-pill status-pill--active' : 'status-pill'}>
                    {member.is_active ? 'Actief' : 'Inactief'}
                  </span>
                </p>
                <p>
                  Lid sinds: {new Date(member.joined_at).toLocaleDateString()}
                  {member.left_at ? ` · Vertrokken: ${new Date(member.left_at).toLocaleDateString()}` : ''}
                </p>
              </div>

              <div className="member-card__actions">
                <label>
                  Rol
                  <select
                    value={member.role}
                    disabled={!canChangeRole || isPending}
                    onChange={(event) =>
                      void handleRoleChange(member, event.target.value as BandMembership['role'])
                    }
                  >
                    {roleChoices.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>

                {member.is_active ? (
                  <button
                    type="button"
                    className="danger-button"
                    disabled={isPending}
                    onClick={() => void handleDeactivate(member)}
                  >
                    Deactiveren
                  </button>
                ) : (
                  <button type="button" disabled={isPending} onClick={() => void handleReactivate(member)}>
                    Heractiveren
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </PageCard>
  )
}
