import { type Message } from '../shared/messageStore'

/**
 * Checks if a conversation has multiple models by looking for assistant messages
 * with different model identifiers
 */
export function isMultiModelConversation(messages: Message[]): boolean {
  if (!messages || messages.length === 0) return false
  
  // Get all assistant messages that have model information
  const assistantMessages = messages.filter(msg => 
    msg.role === 'assistant' && 
    (msg.model || msg.metadata?.modelId)
  )
  
  if (assistantMessages.length === 0) return false
  
  // Get unique models from assistant messages
  const models = new Set<string>()
  
  for (const message of assistantMessages) {
    const modelId = message.metadata?.modelId || `${message.provider}/${message.model}`
    if (modelId && modelId !== 'undefined/undefined') {
      models.add(modelId)
    }
  }
  
  // If we have more than one unique model, it's a multi-model conversation
  return models.size > 1
}

/**
 * Gets the display name for a conversation model
 * Returns "Multi-Model" if multiple models are detected, otherwise the model name
 */
export function getConversationModelDisplay(
  conversationModel: string | undefined,
  messages: Message[]
): string {
  if (isMultiModelConversation(messages)) {
    return 'Multi-Model'
  }
  
  return conversationModel || 'No model'
}