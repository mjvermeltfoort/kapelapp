import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { FormField, Select } from '../../../components/FormField'
import { formatRoleLabel } from '../../../lib/roles'
import type { BandRole } from '../../../lib/supabase/types'
import type { BandMemberRecord } from '../api/members'

export type ConfirmableMemberAction = 'deactivate' | 'delete'

type BandMemberCardProps = {
  member: BandMemberRecord
  roleChoices: BandRole[]
  canChangeRole: boolean
  canRemoveMember: boolean
  showBandName: boolean
  isPending: boolean
  confirmAction: ConfirmableMemberAction | null
  onRoleChange: (role: BandRole) => void
  onDeactivate: () => void
  onReactivate: () => void
  onDelete: () => void
  onCancelConfirm: () => void
}

export function BandMemberCard({
  member,
  roleChoices,
  canChangeRole,
  canRemoveMember,
  showBandName,
  isPending,
  confirmAction,
  onRoleChange,
  onDeactivate,
  onReactivate,
  onDelete,
  onCancelConfirm,
}: BandMemberCardProps) {
  return (
    <div className="member-card member-card--enhanced">
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
        {showBandName ? (
          <div className="member-card__detail-item">
            <span className="member-card__label">Kapel</span>
            <p>{member.band_name}</p>
          </div>
        ) : null}
        <div className="member-card__detail-item">
          <span className="member-card__label">Instrument</span>
          <p>{member.instrument ?? 'Niet ingevuld'}</p>
        </div>
        <div className="member-card__detail-item">
          <span className="member-card__label">Lid sinds</span>
          <p>{new Date(member.joined_at).toLocaleDateString()}</p>
        </div>
        {member.left_at ? (
          <div className="member-card__detail-item">
            <span className="member-card__label">Vertrokken</span>
            <p>{new Date(member.left_at).toLocaleDateString()}</p>
          </div>
        ) : null}
      </div>

      <div className="member-card__actions member-card__actions--enhanced">
        <FormField label="Rol">
          <Select
            value={member.role}
            disabled={!canChangeRole || isPending}
            onChange={(event) =>
              onRoleChange(event.target.value as BandRole)
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
          <div className="member-card__button-stack" role="group" aria-label={`Acties voor ${member.display_name ?? member.email}`}>
            {confirmAction === 'deactivate' ? (
              <div className="stack-sm">
                <p className="muted-text">Weet je zeker dat je dit lid wilt deactiveren?</p>
                <Button type="button" variant="secondary" disabled={isPending} onClick={onDeactivate} fullWidth>
                  Ja, deactiveren
                </Button>
                <Button type="button" variant="ghost" disabled={isPending} onClick={onCancelConfirm} fullWidth>
                  Annuleren
                </Button>
              </div>
            ) : member.is_active ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={onDeactivate}
                fullWidth
              >
                Deactiveren
              </Button>
            ) : (
              <Button type="button" disabled={isPending} onClick={onReactivate} fullWidth>
                Heractiveren
              </Button>
            )}

            {confirmAction === 'delete' ? (
              <div className="stack-sm">
                <p className="muted-text">Weet je zeker dat je dit lid definitief wilt verwijderen?</p>
                <Button type="button" variant="danger" disabled={isPending} onClick={onDelete} fullWidth>
                  Ja, definitief verwijderen
                </Button>
                <Button type="button" variant="ghost" disabled={isPending} onClick={onCancelConfirm} fullWidth>
                  Annuleren
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="danger"
                disabled={isPending}
                onClick={onDelete}
                fullWidth
              >
                Definitief verwijderen
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
