import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { EmptyState } from '../../../components/EmptyState'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../../auth/hooks/useAuth'
import { useBand } from '../../bands/hooks/useBand'
import {
  deactivateBandMember,
  deleteBandMember,
  listBandMembers,
  reactivateBandMember,
  setBandMemberRole,
  type BandMemberRecord,
} from '../api/members'
import { getErrorMessage } from '../../../lib/errors'
import { bandKeys } from '../../bands/queryKeys'
import type { BandRole } from '../../../lib/supabase/types'
import { BandMemberCard, type ConfirmableMemberAction } from '../components/BandMemberCard'

const roleOptions: BandRole[] = ['member', 'planner', 'admin', 'owner']

type MemberAction = 'role' | ConfirmableMemberAction | 'reactivate'

export function MembersPage() {
  const { profile, user } = useAuth()
  const { activeMembership } = useBand()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ userId: string; action: ConfirmableMemberAction } | null>(null)

  const isSuperadmin = profile?.is_superadmin ?? false
  const canManageMembers = useMemo(
    () => isSuperadmin || ['admin', 'owner'].includes(activeMembership?.role ?? ''),
    [activeMembership?.role, isSuperadmin],
  )

  const membersQuery = useQuery({
    queryKey: bandKeys.members(activeMembership?.band.id),
    queryFn: async () => listBandMembers(activeMembership!.band.id),
    enabled: Boolean(canManageMembers && activeMembership?.band.id),
  })

  async function runMemberAction(member: BandMemberRecord, action: MemberAction, role?: BandRole) {
    if ((action === 'deactivate' || action === 'delete') && (confirm?.userId !== member.user_id || confirm.action !== action)) {
      setConfirm({ userId: member.user_id, action })
      return
    }

    const target = { bandId: member.band_id, userId: member.user_id }
    const operations = {
      role: { run: () => setBandMemberRole({ ...target, role: role ?? member.role }), success: 'Rol bijgewerkt.', fallback: 'Rol wijzigen mislukt.' },
      deactivate: { run: () => deactivateBandMember(target), success: 'Lid gedeactiveerd.', fallback: 'Deactiveren mislukt.' },
      delete: { run: () => deleteBandMember(target), success: 'Lid definitief verwijderd uit kapel.', fallback: 'Verwijderen mislukt.' },
      reactivate: { run: () => reactivateBandMember(target), success: 'Lid opnieuw geactiveerd.', fallback: 'Heractiveren mislukt.' },
    } satisfies Record<MemberAction, { run: () => Promise<unknown>; success: string; fallback: string }>
    const operation = operations[action]

    setConfirm(null)
    setMessage(null)
    setError(null)
    setPendingUserId(member.user_id)

    try {
      await operation.run()
      setMessage(operation.success)
      await membersQuery.refetch()
    } catch (submitError) {
      setError(getErrorMessage(submitError, operation.fallback))
    } finally {
      setPendingUserId(null)
    }
  }

  if (!activeMembership) {
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
      title="Leden"
      description="Beheer rollen en actieve leden van je kapel."
    >
      <div className="members-header">
        <Badge tone="brand">
          {(membersQuery.data ?? []).length} lid{(membersQuery.data ?? []).length === 1 ? '' : 'en'}
        </Badge>
        <p className="muted-text">Kapel: {activeMembership.band.name}</p>
      </div>

      {membersQuery.isLoading ? <LoadingState>Leden worden geladen…</LoadingState> : null}
      {membersQuery.error ? <Alert tone="error">{getErrorMessage(membersQuery.error)}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      {!membersQuery.isLoading && !membersQuery.data?.length ? (
        <EmptyState>Geen leden gevonden.</EmptyState>
      ) : null}

      <div className="members-list">
        {membersQuery.data?.map((member) => {
          const canAssignOwner = isSuperadmin || activeMembership.role === 'owner'

          return (
            <BandMemberCard
              key={member.membership_id}
              member={member}
              roleChoices={canAssignOwner ? roleOptions : roleOptions.filter((role) => role !== 'owner')}
              canChangeRole={canAssignOwner || member.role !== 'owner'}
              canRemoveMember={member.user_id !== user?.id && (canAssignOwner || member.role !== 'owner')}
              showBandName={isSuperadmin}
              isPending={pendingUserId === member.user_id}
              confirmAction={confirm?.userId === member.user_id ? confirm.action : null}
              onRoleChange={(role) => void runMemberAction(member, 'role', role)}
              onDeactivate={() => void runMemberAction(member, 'deactivate')}
              onReactivate={() => void runMemberAction(member, 'reactivate')}
              onDelete={() => void runMemberAction(member, 'delete')}
              onCancelConfirm={() => setConfirm(null)}
            />
          )
        })}
      </div>
    </PageCard>
  )
}
