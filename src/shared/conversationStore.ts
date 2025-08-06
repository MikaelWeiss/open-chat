import Database from '@tauri-apps/plugin-sql'

// Conversation Database
class ConversationDatabase {
  private db: Database | null = null
  private listeners = new Set<() => void>()

  async init() {
    if (!this.db) {
      this.db = await Database.load('sqlite:open_chat.db')
      await this.createTable()
    }
    return this.db
  }

  private async createTable() {
    const db = await this.init()
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        system_prompt TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  // Listener management
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  async createConversation(title: string, provider: string, model: string, systemPrompt?: string) {
    const db = await this.init()
    const result = await db.execute(
      'INSERT INTO conversations (title, provider, model, system_prompt) VALUES ($1, $2, $3, $4)',
      [title, provider, model, systemPrompt || null]
    )
    this.notifyListeners()
    return result.lastInsertId
  }

  async getConversations() {
    const db = await this.init()
    return await db.select(
      'SELECT * FROM conversations ORDER BY updated_at DESC'
    ) as Conversation[]
  }

  async getConversation(id: number) {
    const db = await this.init()
    const result = await db.select(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    ) as Conversation[]
    return result[0] || null
  }

  async updateConversation(id: number, updates: Partial<Pick<Conversation, 'title' | 'provider' | 'model' | 'system_prompt'>>) {
    const db = await this.init()
    const fields = []
    const values = []

    if (updates.title !== undefined) {
      fields.push('title = $' + (values.length + 1))
      values.push(updates.title)
    }
    if (updates.provider !== undefined) {
      fields.push('provider = $' + (values.length + 1))
      values.push(updates.provider)
    }
    if (updates.model !== undefined) {
      fields.push('model = $' + (values.length + 1))
      values.push(updates.model)
    }
    if (updates.system_prompt !== undefined) {
      fields.push('system_prompt = $' + (values.length + 1))
      values.push(updates.system_prompt)
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const result = await db.execute(
      `UPDATE conversations SET ${fields.join(', ')} WHERE id = $${values.length}`,
      values
    )
    this.notifyListeners()
    return result
  }

  async deleteConversation(id: number) {
    const db = await this.init()
    const result = await db.execute('DELETE FROM conversations WHERE id = $1', [id])
    this.notifyListeners()
    return result
  }

  async touchConversation(id: number) {
    const db = await this.init()
    const result = await db.execute(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    )
    this.notifyListeners()
    return result
  }

  async updateConversationTitle(id: number, title: string) {
    const db = await this.init()
    const result = await db.execute(
      'UPDATE conversations SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [title, id]
    )
    this.notifyListeners()
    return result
  }
}

// Export singleton instance
export const conversationStore = new ConversationDatabase()

// Types
export interface Conversation {
  id: number
  title: string
  provider: string
  model: string
  system_prompt: string | null
  created_at: string
  updated_at: string
}