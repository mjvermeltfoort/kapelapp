import { type PropsWithChildren } from 'react'
import './PageCard.css'

type PageCardProps = PropsWithChildren<{
  title: string
  description?: string
}>

export function PageCard({ title, description: _description, children }: PageCardProps) {
  return (
    <section className="page-card">
      <header className="page-card__header">
        <h2>{title}</h2>
      </header>
      <div className="page-card__body">{children}</div>
    </section>
  )
}
