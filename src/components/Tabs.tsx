import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type TabsProps = {
  children: ReactNode
  'aria-label': string
}

type TabLinkProps = {
  to: string
  isActive?: boolean
  replace?: boolean
  children: ReactNode
}

export function Tabs({ children, ...props }: TabsProps) {
  return (
    <nav className="tab-nav" {...props}>
      {children}
    </nav>
  )
}

export function TabLink({ to, isActive = false, replace = false, children }: TabLinkProps) {
  return (
    <Link to={to} replace={replace} className={isActive ? 'tab-link tab-link--active' : 'tab-link'}>
      {children}
    </Link>
  )
}
