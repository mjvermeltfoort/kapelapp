import type { HTMLAttributes, ReactNode } from 'react'

type EmptyStateProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode
  action?: ReactNode
}

export function EmptyState({ children, className, action, ...props }: EmptyStateProps) {
  const text = (
    <p className={['empty-state', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </p>
  )

  if (!action) {
    return text
  }

  return (
    <div className="empty-state-block">
      {text}
      <div className="empty-state-block__action">{action}</div>
    </div>
  )
}
