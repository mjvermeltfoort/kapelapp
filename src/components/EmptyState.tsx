import type { HTMLAttributes, ReactNode } from 'react'

type EmptyStateProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode
}

export function EmptyState({ children, className, ...props }: EmptyStateProps) {
  return (
    <p className={['empty-state', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </p>
  )
}
