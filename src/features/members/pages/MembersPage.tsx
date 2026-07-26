import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { PageCard } from '../../../components/PageCard'
import type { BandMembership } from '../../bands/api/bands'
import { useBand } from '../../bands/hooks/useBand'
import {
  deactivateBandMember,
  listBandMembers,
  reactivateBandMember,
  setBandMemberRole,
  type BandMemberRecord,
} from '../api/members'

const roleOptions: Array<BandMembership['role']> = ['member', 'planner', 'admin', 'owner']

export function MembersPage() {
  const { activeMembership } = useBand()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const canManageMembers = useMemo(
    () => ['admin', 'owner'].includes(activeMembership?.role ?? ''),
    [activeMembership?.role],
  )

  const membersQuery = useQuery({
    queryKey: ['band-members', activeMembership?.band.id],
    queryFn: async () => listBandMembers(activeMembership!.band.id),
    enabled: Boolean(activeMembership?.band.id && canManageMembers),
  })

  async function handleRoleChange(member: BandMemberRecord, role: BandMembership['role']) {
    if (!activeMembership) {
      return
    }

    setMessage(null)
    setError(null)
    setPendingKey(`role:${member.user_id}`)

    try {
      await setBandMemberRole({
        bandId: activeMembership.band.id,
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
    if (!activeMembership) {
      return
    }

    setMessage(null)
    setError(null)
    setPendingKey(`deactivate:${member.user_id}`)

    try {
      await deactivateBandMember({
        bandId: activeMembership.band.id,
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
    if (!activeMembership) {
      return
    }

    setMessage(null)
    setError(null)
    setPendingKey(`reactivate:${member.user_id}`)

    try {
      await reactivateBandMember({
        bandId: activeMembership.band.id,
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

  if (!activeMembership) {
    return (
      <PageCard title="Leden- en rollenbeheer" description="Kies eerst een actieve kapel.">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  if (!canManageMembers) {
    return (
      <PageCard
        title="Leden- en rollenbeheer"
        description="Alleen admins en owners kunnen leden en rollen beheren."
      >
        <p>Je huidige rol heeft geen toegang tot dit scherm.</p>
      </PageCard>
    )
  }

  return (
    <PageCard
      title="Leden- en rollenbeheer"
      description={`Beheer leden van ${activeMembership.band.name}. Owners kunnen owner-rollen beheren; admins niet.`}
    >
      {membersQuery.isLoading ? <p>Leden worden geladen…</p> : null}
      {membersQuery.error instanceof Error ? <p role="alert">{membersQuery.error.message}</p> : null}
      {message ? <p>{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      {!membersQuery.isLoading && !membersQuery.data?.length ? <p>Geen leden gevonden.</p> : null}

      <div className="stack-sm">
        {membersQuery.data?.map((member) => {
          const isPending = pendingKey?.includes(member.user_id) ?? false
          const canAssignOwner = activeMembership.role === 'owner'
          const roleChoices = canAssignOwner
            ? roleOptions
            : roleOptions.filter((role) => role !== 'owner')
          const canChangeRole = canAssignOwner || member.role !== 'owner'

          return (
            <div key={member.membership_id} className="member-card">
              <div>
                <strong>{member.display_name ?? member.email}</strong>
                <p>{member.email}</p>
                <p>Instrument: {member.instrument ?? 'Niet ingevuld'}</p>
                <p>Status: {member.is_active ? 'Actief' : 'Inactief'}</p>
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
