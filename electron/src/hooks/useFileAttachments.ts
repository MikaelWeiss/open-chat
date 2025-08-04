import { useState } from 'react'
import { FileText, Image, Volume2 } from 'lucide-react'
import type { ModelCapabilities } from '@/types/electron'

export interface FileAttachment {
  path: string
  base64: string
  mimeType: string
  name: string
  type: 'image' | 'audio' | 'file'
}

interface UseFileAttachmentsReturn {
  attachments: FileAttachment[]
  addAttachment: (modelCapabilities?: ModelCapabilities) => Promise<void>
  removeAttachment: (index: number) => void
  clearAttachments: () => void
  setAttachments: (attachments: FileAttachment[]) => void
  getAttachmentIcon: (type: string) => any
}

export function useFileAttachments(): UseFileAttachmentsReturn {
  const [attachments, setAttachments] = useState<FileAttachment[]>([])

  const addAttachment = async (modelCapabilities?: ModelCapabilities) => {
    // This function should only be called when the button is visible (i.e., when capabilities exist)
    // But we'll add a safety check just in case
    const hasCapabilities = modelCapabilities?.vision || modelCapabilities?.audio || modelCapabilities?.files
    if (!hasCapabilities) return
    
    try {
      const result = await window.electronAPI.files.selectFileByCapabilities(modelCapabilities)
      if (result) {
        // Determine attachment type based on MIME type
        let type: 'image' | 'audio' | 'file' = 'file'
        if (result.mimeType.startsWith('image/')) {
          type = 'image'
        } else if (result.mimeType.startsWith('audio/')) {
          type = 'audio'
        }
        
        const attachment: FileAttachment = {
          path: result.path,
          base64: result.base64,
          mimeType: result.mimeType,
          name: result.name,
          type
        }
        
        setAttachments(prev => [...prev, attachment])
      }
    } catch (error) {
      console.error('Failed to select file:', error)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const clearAttachments = () => {
    setAttachments([])
  }

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image
      case 'audio':
        return Volume2
      default:
        return FileText
    }
  }

  return {
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
    setAttachments,
    getAttachmentIcon
  }
}