import { useEffect, useRef, useState } from 'react'

const DEFAULT_LABEL = 'Kopieer herinnering'

export function useCopyReminder(text: string) {
  const [label, setLabel] = useState(DEFAULT_LABEL)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  async function copy() {
    if (!text) {
      return
    }

    setError(null)

    try {
      await navigator.clipboard.writeText(text)
      setLabel('Herinnering gekopieerd')

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => setLabel(DEFAULT_LABEL), 2000)
    } catch {
      setError('Kopiëren van herinnering mislukt.')
    }
  }

  return { label, error, copy }
}
