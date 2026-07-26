import { Link } from 'react-router-dom'
import { PageCard } from './PageCard'

type FeaturePlaceholderProps = {
  title: string
  description: string
  checklist: string[]
  links?: Array<{ to: string; label: string }>
}

export function FeaturePlaceholder({ title, description, checklist, links }: FeaturePlaceholderProps) {
  return (
    <PageCard title={title} description={description}>
      <ul>
        {checklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {links?.length ? (
        <div>
          {links.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </PageCard>
  )
}
