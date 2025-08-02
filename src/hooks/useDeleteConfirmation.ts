import { useState, useCallback } from 'react'

interface UseDeleteConfirmationReturn {
  deleteConfirm: string | null
  handleDeleteClick: (e: React.MouseEvent, conversationId: string, onDelete: (id: string) => void) => void
  handleConfirmDelete: (onDelete: (id: string) => void) => void
  handleCancelDelete: () => void
}

export function useDeleteConfirmation(): UseDeleteConfirmationReturn {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDeleteClick = useCallback((
    e: React.MouseEvent, 
    conversationId: string, 
    onDelete: (id: string) => void
  ) => {
    e.stopPropagation()
    
    // Check if Command (Mac) or Ctrl (Windows/Linux) is held down
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const isModifierPressed = isMac ? e.metaKey : e.ctrlKey
    
    if (isModifierPressed) {
      // Delete immediately without confirmation
      onDelete(conversationId)
    } else {
      // Show confirmation dialog
      setDeleteConfirm(conversationId)
    }
  }, [])

  const handleConfirmDelete = useCallback((onDelete: (id: string) => void) => {
    if (deleteConfirm) {
      onDelete(deleteConfirm)
      setDeleteConfirm(null)
    }
  }, [deleteConfirm])

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm(null)
  }, [])

  return {
    deleteConfirm,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete
  }
}