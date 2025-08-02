import { useState, useCallback } from 'react'

interface ContextMenuState {
  x: number
  y: number
  conversationId: string
}

interface UseContextMenuReturn {
  contextMenu: ContextMenuState | null
  handleRightClick: (e: React.MouseEvent, conversationId: string, containerRef: React.RefObject<HTMLElement>) => void
  handleContextMenuAction: (action: string, conversationId: string, onAction: (action: string, id: string) => void) => void
  handleClickOutside: () => void
}

export function useContextMenu(): UseContextMenuReturn {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const handleRightClick = useCallback((
    e: React.MouseEvent, 
    conversationId: string, 
    containerRef: React.RefObject<HTMLElement>
  ) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        conversationId
      })
    }
  }, [])

  const handleContextMenuAction = useCallback((
    action: string, 
    conversationId: string, 
    onAction: (action: string, id: string) => void
  ) => {
    setContextMenu(null)
    onAction(action, conversationId)
  }, [])

  const handleClickOutside = useCallback(() => {
    setContextMenu(null)
  }, [])

  return {
    contextMenu,
    handleRightClick,
    handleContextMenuAction,
    handleClickOutside
  }
}