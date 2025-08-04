import { useCallback } from 'react'

interface UseResizableReturn {
  handleMouseDown: (e: React.MouseEvent) => void
}

export function useResizable(
  currentWidth: number,
  onWidthChange: (width: number) => void,
  minWidth: number = 240,
  maxWidth: number = 480
): UseResizableReturn {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    
    const startX = e.clientX
    const startWidth = currentWidth
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX))
      onWidthChange(newWidth)
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [currentWidth, onWidthChange, minWidth, maxWidth])

  return {
    handleMouseDown
  }
}