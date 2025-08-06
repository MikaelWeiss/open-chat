import Database from '@tauri-apps/plugin-sql'

// Database (SQLite)
class ChatDatabase {
  private db: Database | null = null

  async init() {
    if (!this.db) {
      this.db = await Database.load('sqlite:open_chat.db')
      await this.createTables()
    }
    return this.db
  }

  private async createTables() {
    const db = await this.init()
    
    // Create conversations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create messages table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
      )
    `)

    // Create providers table for AI provider configs
    await db.execute(`
      CREATE TABLE IF NOT EXISTS providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        api_key TEXT,
        base_url TEXT,
        model TEXT,
        is_active BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  // Conversation methods
  async createConversation(title: string) {
    const db = await this.init()
    const result = await db.execute(
      'INSERT INTO conversations (title) VALUES ($1)',
      [title]
    )
    return result.lastInsertId
  }

  async getConversations() {
    const db = await this.init()
    return await db.select(
      'SELECT * FROM conversations ORDER BY updated_at DESC'
    )
  }

  async updateConversation(id: number, title: string) {
    const db = await this.init()
    return await db.execute(
      'UPDATE conversations SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [title, id]
    )
  }

  async deleteConversation(id: number) {
    const db = await this.init()
    return await db.execute('DELETE FROM conversations WHERE id = $1', [id])
  }

  // Message methods
  async addMessage(conversationId: number, role: 'user' | 'assistant' | 'system', content: string) {
    const db = await this.init()
    const result = await db.execute(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [conversationId, role, content]
    )
    
    // Update conversation timestamp
    await db.execute(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    )
    
    return result.lastInsertId
  }

  async getMessages(conversationId: number) {
    const db = await this.init()
    return await db.select(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    )
  }

  async deleteMessage(id: number) {
    const db = await this.init()
    return await db.execute('DELETE FROM messages WHERE id = $1', [id])
  }

  // Provider methods
  async saveProvider(name: string, config: { apiKey?: string; baseUrl?: string; model?: string }) {
    const db = await this.init()
    return await db.execute(
      'INSERT OR REPLACE INTO providers (name, api_key, base_url, model) VALUES ($1, $2, $3, $4)',
      [name, config.apiKey || null, config.baseUrl || null, config.model || null]
    )
  }

  async getProviders() {
    const db = await this.init()
    return await db.select('SELECT * FROM providers ORDER BY name')
  }

  async setActiveProvider(name: string) {
    const db = await this.init()
    // First deactivate all providers
    await db.execute('UPDATE providers SET is_active = 0')
    // Then activate the selected one
    return await db.execute('UPDATE providers SET is_active = 1 WHERE name = $1', [name])
  }

  async getActiveProvider() {
    const db = await this.init()
    const result = await db.select('SELECT * FROM providers WHERE is_active = 1 LIMIT 1') as Provider[]
    return result[0] || null
  }
}

// Export singleton instance
export const database = new ChatDatabase()

// Types
export interface Conversation {
  id: number
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  conversation_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface Provider {
  id: number
  name: string
  api_key: string | null
  base_url: string | null
  model: string | null
  is_active: boolean
  created_at: string
}