import type { HTMLAttributes, ReactNode } from 'react'

type AlertTone = 'success' | 'error' | 'info'

type AlertProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode
  tone?: AlertTone
}

export function Alert({ children, className, tone = 'info', role, ...props }: AlertProps) {
  const classes = ['alert', `alert--${tone}`, className].filter(Boolean).join(' ')
  const computedRole = role ?? (tone === 'error' ? 'alert' : 'status')

  return (
    <p
      role={computedRole}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={classes}
      {...props}
    >
      {children}
    </p>
  )
}
