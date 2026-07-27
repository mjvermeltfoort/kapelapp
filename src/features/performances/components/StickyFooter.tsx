import { Button } from '../../../components/Button'

type StickyFooterProps = {
  onPrimaryClick: () => void
  onSecondaryClick: () => void
}

export function StickyFooter({ onPrimaryClick, onSecondaryClick }: StickyFooterProps) {
  return (
    <div className="planner-sticky-footer">
      <Button type="button" onClick={onPrimaryClick} fullWidth>
        Terug naar optreden
      </Button>
      <Button type="button" variant="secondary" onClick={onSecondaryClick} fullWidth>
        Sluiten
      </Button>
    </div>
  )
}
