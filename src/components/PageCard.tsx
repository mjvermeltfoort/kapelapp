import { type PropsWithChildren, type ReactNode } from 'react'
import './PageCard.css'

type PageCardProps = PropsWithChildren<{
  title: string
  description?: string
  headerAction?: ReactNode
}>

export function PageCard({ title, description: _description, headerAction, children }: PageCardProps) {
  return (
    <section className="page-card">
      <header className="page-card__header">
        <h2>{title}</h2>
        {headerAction ? <div className="page-card__header-action">{headerAction}</div> : null}
      </header>
      <div className="page-card__body">{children}</div>
    </section>
  )
}
