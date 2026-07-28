import { type PropsWithChildren, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import './PageCard.css'

type PageCardProps = PropsWithChildren<{
  title: string
  description?: string
  headerAction?: ReactNode
  backTo?: string
}>

export function PageCard({ title, description, headerAction, backTo, children }: PageCardProps) {
  const navigate = useNavigate()

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(backTo ?? '/', { replace: true })
  }

  return (
    <section className="page-card">
      <header className="page-card__header">
        <div className="page-card__header-content">
          <div className="page-card__title-row">
            {backTo ? (
              <button type="button" className="page-card__back-button" onClick={handleBack} aria-label="Terug">
                <Icon name="back" className="page-card__back-icon" />
              </button>
            ) : null}
            <h2>{title}</h2>
          </div>
          {description ? <p className="page-card__description">{description}</p> : null}
        </div>
        {headerAction ? <div className="page-card__header-action">{headerAction}</div> : null}
      </header>
      <div className="page-card__body">{children}</div>
    </section>
  )
}
