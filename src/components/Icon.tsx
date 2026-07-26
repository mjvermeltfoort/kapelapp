type IconName = 'performances' | 'admin' | 'profile' | 'add' | 'bands'

type IconProps = {
  name: IconName
  className?: string
}

export function Icon({ name, className }: IconProps) {
  switch (name) {
    case 'performances':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path
            d="M15 4v10.2a3.8 3.8 0 1 1-2-3.36V7.1l8-1.78V15.2a3.8 3.8 0 1 1-2-3.36V2.8L15 4Z"
            fill="currentColor"
          />
        </svg>
      )
    case 'admin':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path
            d="M12 2 4 5v6c0 5.25 3.4 10.07 8 11 4.6-.93 8-5.75 8-11V5l-8-3Zm0 5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm4.2 10h-8.4v-.4c0-1.76 1.63-3.2 3.64-3.2h1.12c2 0 3.64 1.44 3.64 3.2v.4Z"
            fill="currentColor"
          />
        </svg>
      )
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path
            d="M12 3.25a4.75 4.75 0 1 1 0 9.5 4.75 4.75 0 0 1 0-9.5ZM5 19.2c0-3.1 3.13-5.45 7-5.45s7 2.35 7 5.45V21H5v-1.8Z"
            fill="currentColor"
          />
        </svg>
      )
    case 'add':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" fill="currentColor" />
        </svg>
      )
    case 'bands':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path
            d="M12 3.5 4 7.25v9.5L12 20.5l8-3.75v-9.5L12 3.5Zm0 2.2 5.1 2.39L12 10.48 6.9 8.09 12 5.7Zm-6 4.02 5 2.34v5.69l-5-2.34V9.72Zm7 8.03v-5.69l5-2.34v5.69l-5 2.34Z"
            fill="currentColor"
          />
        </svg>
      )
  }
}
