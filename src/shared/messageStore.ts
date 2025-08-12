import Database from '@tauri-apps/plugin-sql'
import { conversationStore } from './conversationStore'

// Message Database
class MessageDatabase {
  private db: Database | null = null
  private readonly SCHEMA_VERSION = 2

  async init() {
    if (!this.db) {
      this.db = await Database.load('sqlite:open_chat.db')
      await this.createTable()
      await this.runMigrations()
    }
    return this.db
  }

  private async createTable() {
    const db = this.db!
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
        
        text TEXT,
        thinking TEXT,
        images JSON,
        audio JSON,
        files JSON,
        [references] JSON,
        
        input_tokens INTEGER,
        output_tokens INTEGER,
        reasoning_tokens INTEGER,
        cached_tokens INTEGER,
        cost REAL,
        temperature REAL,
        max_tokens INTEGER,
        top_p REAL,
        top_k INTEGER,
        processing_time_ms INTEGER,
        
        metadata JSON,
        created_at DATETIME,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
      )
    `)

    // Create schema version table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
      )
    `)
  }

  private async runMigrations() {
    const db = this.db!
    
    // Get current schema version
    const result = await db.select('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1') as { version: number }[]
    const currentVersion = result.length > 0 ? result[0].version : 0

    // Run migrations in sequence
    if (currentVersion < 1) {
      await this.migrate_v1()
    }
    if (currentVersion < 2) {
      await this.migrate_v2_add_sort_order()
    }

    // Update schema version
    if (currentVersion < this.SCHEMA_VERSION) {
      await db.execute('DELETE FROM schema_version')
      await db.execute('INSERT INTO schema_version (version) VALUES ($1)', [this.SCHEMA_VERSION])
    }
  }

  private async migrate_v1() {
    // This is the initial migration - table already created by createTable()
    console.log('Migration v1: Initial schema - already handled by createTable()')
  }

  private async migrate_v2_add_sort_order() {
    const db = this.db!
    console.log('Migration v2: Adding sortOrder column to messages table')
    
    try {
      // Add sortOrder column with default NULL for existing messages
      await db.execute(`
        ALTER TABLE messages 
        ADD COLUMN sort_order INTEGER DEFAULT NULL
      `)
      console.log('Migration v2: sortOrder column added successfully')
    } catch (error) {
      // If column already exists, this will fail - that's okay
      console.log('Migration v2: sortOrder column may already exist, continuing...', error)
    }
  }

  async addMessage(conversationId: number, message: CreateMessageInput) {
    const db = await this.init()
    const now = new Date().toISOString()
    
    const result = await db.execute(`
      INSERT INTO messages (
        conversation_id, role, text, thinking, images, audio, files, [references],
        input_tokens, output_tokens, reasoning_tokens, cached_tokens, cost,
        temperature, max_tokens, top_p, top_k, processing_time_ms, metadata, sort_order, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    `, [
      conversationId,
      message.role,
      message.text || null,
      message.thinking || null,
      message.images ? JSON.stringify(message.images) : null,
      message.audio ? JSON.stringify(message.audio) : null,
      message.files ? JSON.stringify(message.files) : null,
      message.references ? JSON.stringify(message.references) : null,
      message.input_tokens || null,
      message.output_tokens || null,
      message.reasoning_tokens || null,
      message.cached_tokens || null,
      message.cost || null,
      message.temperature || null,
      message.max_tokens || null,
      message.top_p || null,
      message.top_k || null,
      message.processing_time_ms || null,
      message.metadata ? JSON.stringify(message.metadata) : null,
      message.sortOrder || null,
      now
    ])
    
    // Update conversation timestamp
    await conversationStore.touchConversation(conversationId)
    
    // If this is the first user message, update the conversation title
    if (message.role === 'user' && message.text) {
      const allMessages = await this.getMessages(conversationId)
      const userMessages = allMessages.filter(msg => msg.role === 'user')
      
      if (userMessages.length === 1) {
        // This is the first user message, update the conversation title
        const truncatedTitle = message.text.length > 50 
          ? message.text.substring(0, 50) + '...' 
          : message.text
        await conversationStore.updateConversationTitle(conversationId, truncatedTitle)
      }
    }
    
    return result.lastInsertId
  }

  async getMessages(conversationId: number, orderBySortOrder: boolean = false) {
    const db = await this.init()
    
    // Order by sortOrder when available and requested, otherwise by created_at
    const orderBy = orderBySortOrder 
      ? 'ORDER BY CASE WHEN sort_order IS NULL THEN created_at ELSE sort_order END ASC, created_at ASC'
      : 'ORDER BY created_at ASC'
    
    const messages = await db.select(
      `SELECT * FROM messages WHERE conversation_id = $1 ${orderBy}`,
      [conversationId]
    ) as RawMessage[]
    
    // Parse JSON fields
    return messages.map(this.parseMessage)
  }

  async getMessage(id: number) {
    const db = await this.init()
    const result = await db.select(
      'SELECT * FROM messages WHERE id = $1',
      [id]
    ) as RawMessage[]
    
    return result[0] ? this.parseMessage(result[0]) : null
  }

  async updateMessage(id: number, updates: Partial<CreateMessageInput>) {
    const db = await this.init()
    const fields = []
    const values = []

    if (updates.text !== undefined) {
      fields.push('text = $' + (values.length + 1))
      values.push(updates.text)
    }
    if (updates.thinking !== undefined) {
      fields.push('thinking = $' + (values.length + 1))
      values.push(updates.thinking)
    }
    if (updates.images !== undefined) {
      fields.push('images = $' + (values.length + 1))
      values.push(updates.images ? JSON.stringify(updates.images) : null)
    }
    if (updates.audio !== undefined) {
      fields.push('audio = $' + (values.length + 1))
      values.push(updates.audio ? JSON.stringify(updates.audio) : null)
    }
    if (updates.files !== undefined) {
      fields.push('files = $' + (values.length + 1))
      values.push(updates.files ? JSON.stringify(updates.files) : null)
    }
    if (updates.references !== undefined) {
      fields.push('[references] = $' + (values.length + 1))
      values.push(updates.references ? JSON.stringify(updates.references) : null)
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = $' + (values.length + 1))
      values.push(updates.metadata ? JSON.stringify(updates.metadata) : null)
    }
    if (updates.sortOrder !== undefined) {
      fields.push('sort_order = $' + (values.length + 1))
      values.push(updates.sortOrder)
    }

    values.push(id)

    return await db.execute(
      `UPDATE messages SET ${fields.join(', ')} WHERE id = $${values.length}`,
      values
    )
  }

  async deleteMessage(id: number) {
    const db = await this.init()
    return await db.execute('DELETE FROM messages WHERE id = $1', [id])
  }

  async deleteMessagesFromConversation(conversationId: number) {
    const db = await this.init()
    return await db.execute('DELETE FROM messages WHERE conversation_id = $1', [conversationId])
  }

  async updateMessageSortOrder(id: number, sortOrder: number) {
    const db = await this.init()
    return await db.execute('UPDATE messages SET sort_order = $1 WHERE id = $2', [sortOrder, id])
  }

  async updateMessagesSortOrder(updates: Array<{id: number, sortOrder: number}>) {
    const db = await this.init()
    
    // Use a transaction for bulk updates
    for (const update of updates) {
      await db.execute('UPDATE messages SET sort_order = $1 WHERE id = $2', [update.sortOrder, update.id])
    }
  }

  private parseMessage(raw: RawMessage): Message {
    return {
      ...raw,
      images: raw.images ? JSON.parse(raw.images) : null,
      audio: raw.audio ? JSON.parse(raw.audio) : null,
      files: raw.files ? JSON.parse(raw.files) : null,
      references: raw.references ? JSON.parse(raw.references) : null,
      metadata: raw.metadata ? JSON.parse(raw.metadata) : null
    }
  }
}

// Export singleton instance
export const messageStore = new MessageDatabase()

// Types
export interface Message {
  id: number
  conversation_id: number
  role: 'user' | 'assistant' | 'system' | 'tool'
  
  text?: string | null
  thinking?: string | null
  images?: MediaItem[] | null
  audio?: MediaItem[] | null
  files?: FileItem[] | null
  references?: Reference[] | null
  
  input_tokens?: number | null
  output_tokens?: number | null
  reasoning_tokens?: number | null
  cached_tokens?: number | null
  cost?: number | null
  temperature?: number | null
  max_tokens?: number | null
  top_p?: number | null
  top_k?: number | null
  processing_time_ms?: number | null
  
  metadata?: Record<string, any> | null
  sort_order?: number | null
  created_at: string
}

export interface CreateMessageInput {
  role: 'user' | 'assistant' | 'system' | 'tool'
  text?: string
  thinking?: string
  images?: MediaItem[]
  audio?: MediaItem[]
  files?: FileItem[]
  references?: Reference[]
  input_tokens?: number
  output_tokens?: number
  reasoning_tokens?: number
  cached_tokens?: number
  cost?: number
  temperature?: number
  max_tokens?: number
  top_p?: number
  top_k?: number
  processing_time_ms?: number
  metadata?: Record<string, any>
  sortOrder?: number
}

interface RawMessage {
  id: number
  conversation_id: number
  role: 'user' | 'assistant' | 'system' | 'tool'
  text: string | null
  thinking: string | null
  images: string | null
  audio: string | null
  files: string | null
  references: string | null
  input_tokens: number | null
  output_tokens: number | null
  reasoning_tokens: number | null
  cached_tokens: number | null
  cost: number | null
  temperature: number | null
  max_tokens: number | null
  top_p: number | null
  top_k: number | null
  processing_time_ms: number | null
  metadata: string | null
  sort_order: number | null
  created_at: string
}

export interface MediaItem {
  url?: string
  file_path?: string
  mime_type?: string
  generated?: boolean
  prompt?: string
  revised_prompt?: string
  voice?: string
  duration_seconds?: number
  transcript?: string
  language?: string
}

export interface FileItem {
  path: string
  name: string
  type: string
  size?: number
  content?: string // Base64 encoded content for sending to providers
}

export interface Reference {
  type: 'citation' | 'search' | 'link'
  url?: string
  title?: string
  snippet?: string
  source?: string
  start_pos?: number
  end_pos?: number
  timestamp?: string
  source_type?: 'news' | 'social' | 'web' | 'academic'
  domain?: string
  published_date?: string
}