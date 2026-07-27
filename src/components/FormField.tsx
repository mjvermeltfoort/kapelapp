import { forwardRef, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import type { InputHTMLAttributes } from 'react'

type FormFieldProps = {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
}

export function FormField({ label, hint, children, className }: FormFieldProps) {
  return (
    <label className={['ui-field', className].filter(Boolean).join(' ')}>
      <span className="ui-field__label">{label}</span>
      {children}
      {hint ? <span className="ui-field__hint">{hint}</span> : null}
    </label>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={['ui-input', className].filter(Boolean).join(' ')} {...props} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={['ui-input', className].filter(Boolean).join(' ')} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={['ui-input', className].filter(Boolean).join(' ')} {...props} />
  },
)
