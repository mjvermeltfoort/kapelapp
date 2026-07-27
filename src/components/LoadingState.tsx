import type { HTMLAttributes, ReactNode } from 'react'

type LoadingStateProps = HTMLAttributes<HTMLParagraphElement> & {
  children?: ReactNode
}

export function LoadingState({ children = 'Laden…', className, ...props }: LoadingStateProps) {
  return (
    <p className={['loading-state', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </p>
  )
}
