import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { FormField, Select } from '../../../components/FormField'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../../auth/hooks/useAuth'
import type { BandMembership } from '../../bands/api/bands'
import { useBand } from '../../bands/hooks/useBand'
import {
  deactivateBandMember,
  deleteBandMember,
  listAllMembers,
  listBandMembers,
  reactivateBandMember,
  setBandMemberRole,
  type BandMemberRecord,
} from '../api/members'

const roleOptions: Array<BandMembership['role']> = ['member', 'planner', 'admin', 'owner']

export function MembersPage() {
  const { profile, user } = useAuth()
  const { activeMembership } = useBand()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [confirmKey, setConfirmKey] = useState<string | null>(null)

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
    const key = `deactivate:${member.user_id}`
    if (confirmKey !== key) {
      setConfirmKey(key)
      return
    }
    setConfirmKey(null)
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

  async function handleDelete(member: BandMemberRecord) {
    const key = `delete:${member.user_id}`
    if (confirmKey !== key) {
      setConfirmKey(key)
      return
    }
    setConfirmKey(null)
    setMessage(null)
    setError(null)
    setPendingKey(`delete:${member.user_id}`)

    try {
      await deleteBandMember({
        bandId: member.band_id,
        userId: member.user_id,
      })
      setMessage('Lid definitief verwijderd uit kapel.')
      await membersQuery.refetch()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Verwijderen mislukt.')
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
    <PageCard
      title={isSuperadmin ? 'Alle leden' : 'Leden'}
      description={isSuperadmin ? 'Overzicht van alle leden in systeem.' : 'Beheer rollen en actieve leden van je kapel.'}
    >
      <div className="members-header">
        <Badge tone="brand">
          {(membersQuery.data ?? []).length} lid{(membersQuery.data ?? []).length === 1 ? '' : 'en'}
        </Badge>
        {!isSuperadmin && activeMembership ? (
          <p className="muted-text">Kapel: {activeMembership.band.name}</p>
        ) : null}
      </div>

      {membersQuery.isLoading ? <LoadingState>Leden worden geladen…</LoadingState> : null}
      {membersQuery.error instanceof Error ? <Alert tone="error">{membersQuery.error.message}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      {!membersQuery.isLoading && !membersQuery.data?.length ? (
        <EmptyState>Geen leden gevonden.</EmptyState>
      ) : null}

      <div className="members-list">
        {membersQuery.data?.map((member) => {
          const isPending = pendingKey?.includes(member.user_id) ?? false
          const isCurrentUser = member.user_id === user?.id
          const canAssignOwner = isSuperadmin || activeMembership?.role === 'owner'
          const roleChoices = canAssignOwner
            ? roleOptions
            : roleOptions.filter((role) => role !== 'owner')
          const canChangeRole = isSuperadmin || canAssignOwner || member.role !== 'owner'
          const canRemoveMember =
            !isCurrentUser &&
            (isSuperadmin || activeMembership?.role === 'owner' || member.role !== 'owner')

          return (
            <div key={member.membership_id} className="member-card member-card--enhanced">
              <div className="member-card__identity">
                <div className="member-avatar" aria-hidden="true">
                  {(member.display_name ?? member.email).slice(0, 1).toUpperCase()}
                </div>

                <div className="member-card__identity-text">
                  <div className="member-card__topline">
                    <strong>{member.display_name ?? member.email}</strong>
                    <Badge tone={member.is_active ? 'success' : 'neutral'}>
                      {member.is_active ? 'Actief' : 'Inactief'}
                    </Badge>
                  </div>
                  <p>{member.email}</p>
                </div>
              </div>

              <div className="member-card__details-grid">
                <div className="member-card__detail-item">
                  <span className="member-card__label">Kapel</span>
                  <p>{member.band_name}</p>
                </div>
                <div className="member-card__detail-item">
                  <span className="member-card__label">Instrument</span>
                  <p>{member.instrument ?? 'Niet ingevuld'}</p>
                </div>
                <div className="member-card__detail-item">
                  <span className="member-card__label">Lid sinds</span>
                  <p>{new Date(member.joined_at).toLocaleDateString()}</p>
                </div>
                <div className="member-card__detail-item">
                  <span className="member-card__label">Vertrokken</span>
                  <p>{member.left_at ? new Date(member.left_at).toLocaleDateString() : '—'}</p>
                </div>
              </div>

              <div className="member-card__actions member-card__actions--enhanced">
                <FormField label="Rol">
                  <Select
                    value={member.role}
                    disabled={!canChangeRole || isPending}
                    onChange={(event) =>
                      void handleRoleChange(member, event.target.value as BandMembership['role'])
                    }
                  >
                    {roleChoices.map((role) => (
                      <option key={role} value={role}>
                        {formatRoleLabel(role)}
                      </option>
                    ))}
                  </Select>
                </FormField>

                {canRemoveMember ? (
                  <div className="member-card__button-stack">
                    {confirmKey === `deactivate:${member.user_id}` ? (
                      <div className="stack-sm">
                        <p className="muted-text">Weet je zeker dat je dit lid wilt deactiveren?</p>
                        <Button type="button" variant="secondary" disabled={isPending} onClick={() => void handleDeactivate(member)} fullWidth>
                          Ja, deactiveren
                        </Button>
                        <Button type="button" variant="ghost" disabled={isPending} onClick={() => setConfirmKey(null)} fullWidth>
                          Annuleren
                        </Button>
                      </div>
                    ) : member.is_active ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isPending}
                        onClick={() => void handleDeactivate(member)}
                        fullWidth
                      >
                        Deactiveren
                      </Button>
                    ) : (
                      <Button type="button" disabled={isPending} onClick={() => void handleReactivate(member)} fullWidth>
                        Heractiveren
                      </Button>
                    )}

                    {confirmKey === `delete:${member.user_id}` ? (
                      <div className="stack-sm">
                        <p className="muted-text">Weet je zeker dat je dit lid definitief wilt verwijderen?</p>
                        <Button type="button" variant="danger" disabled={isPending} onClick={() => void handleDelete(member)} fullWidth>
                          Ja, definitief verwijderen
                        </Button>
                        <Button type="button" variant="ghost" disabled={isPending} onClick={() => setConfirmKey(null)} fullWidth>
                          Annuleren
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="danger"
                        disabled={isPending}
                        onClick={() => void handleDelete(member)}
                        fullWidth
                      >
                        Definitief verwijderen
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button type="button" variant="secondary" disabled fullWidth>
                    Niet verwijderbaar
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </PageCard>
  )
}

function formatRoleLabel(role: BandMembership['role']) {
  switch (role) {
    case 'member':
      return 'Lid'
    case 'planner':
      return 'Planner'
    case 'admin':
      return 'Admin'
    case 'owner':
      return 'Eigenaar'
  }
}
