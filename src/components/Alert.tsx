import type { HTMLAttributes, ReactNode } from 'react'

type AlertTone = 'success' | 'error' | 'info'

type AlertProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode
  tone?: AlertTone
}

export function Alert({ children, className, tone = 'info', role, ...props }: AlertProps) {
  const classes = ['alert', `alert--${tone}`, className].filter(Boolean).join(' ')

  return (
    <p role={role ?? (tone === 'error' ? 'alert' : undefined)} className={classes} {...props}>
      {children}
    </p>
  )
}
