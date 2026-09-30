import { useRef, useState, type TouchEvent } from 'react'

const MAX_DRAG_PX = 160
const CLOSE_THRESHOLD_PX = 90

export function useSwipeToClose(onClose: () => void) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }

  function onTouchMove(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touchStart.current || !touch) {
      return
    }

    const deltaY = touch.clientY - touchStart.current.y
    const deltaX = Math.abs(touch.clientX - touchStart.current.x)

    if (deltaY > 0 && deltaY > deltaX) {
      setDragOffset(Math.min(deltaY, MAX_DRAG_PX))
    }
  }

  function onTouchEnd() {
    if (dragOffset > CLOSE_THRESHOLD_PX) {
      onClose()
      return
    }

    touchStart.current = null
    setDragOffset(0)
  }

  return { dragOffset, handlers: { onTouchStart, onTouchMove, onTouchEnd } }
}
