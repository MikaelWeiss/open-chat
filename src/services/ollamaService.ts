// Ollama API service for managing local models
export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model?: string;
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaLibraryModel {
  name: string;
  description?: string;
  tags: string[];
  updated_at: string;
  pulls?: number;
  size?: number;
}

export interface OllamaModelResponse {
  models: OllamaModel[];
}

export interface OllamaLibraryResponse {
  models: OllamaLibraryModel[];
}

export interface OllamaDownloadProgress {
  status: 'pulling' | 'success' | 'error';
  digest?: string;
  total?: number;
  completed?: number;
  progress?: number;
  error?: string;
}

export interface OllamaModelStatus {
  name: string;
  status: 'not_loaded' | 'loading' | 'loaded' | 'error';
  size_vram?: number;
  error?: string;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export class OllamaService {
  private baseUrl = 'http://localhost:11434';
  private timeout = 30000; // 30 seconds default timeout

  constructor(baseUrl?: string, timeout?: number) {
    if (baseUrl) this.baseUrl = baseUrl;
    if (timeout) this.timeout = timeout;
  }

  /**
   * Test if Ollama API is accessible
   */
  async isAccessible(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // Quick check
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get list of locally installed models
   */
  async getInstalledModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data: OllamaModelResponse = await response.json();
      return data.models || [];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get installed models: ${error.message}`);
      }
      throw new Error('Failed to get installed models: Unknown error');
    }
  }

  /**
   * Search for models in Ollama library
   */
  async searchLibraryModels(query?: string): Promise<OllamaLibraryModel[]> {
    try {
      // Note: This is a placeholder - Ollama doesn't have a direct library search API
      // In a real implementation, you might need to fetch from a model registry
      // or use a predefined list of popular models
      const popularModels: OllamaLibraryModel[] = [
        {
          name: 'llama3.2',
          description: 'Meta\'s Llama 3.2 model family',
          tags: ['3b', '1b', '11b', '90b'],
          updated_at: new Date().toISOString(),
          pulls: 1000000,
        },
        {
          name: 'llama3.1',
          description: 'Meta\'s Llama 3.1 model family',
          tags: ['8b', '70b', '405b'],
          updated_at: new Date().toISOString(),
          pulls: 800000,
        },
        {
          name: 'phi3',
          description: 'Microsoft\'s Phi-3 small language model',
          tags: ['mini', 'small', 'medium'],
          updated_at: new Date().toISOString(),
          pulls: 500000,
        },
        {
          name: 'mistral',
          description: 'Mistral 7B model',
          tags: ['7b', 'instruct'],
          updated_at: new Date().toISOString(),
          pulls: 600000,
        },
        {
          name: 'codellama',
          description: 'Code Llama for code generation',
          tags: ['7b', '13b', '34b'],
          updated_at: new Date().toISOString(),
          pulls: 400000,
        },
        {
          name: 'llava',
          description: 'Large Language and Vision Assistant',
          tags: ['7b', '13b', '34b'],
          updated_at: new Date().toISOString(),
          pulls: 300000,
        },
      ];

      if (query) {
        const queryLower = query.toLowerCase();
        return popularModels.filter(model => 
          model.name.toLowerCase().includes(queryLower) ||
          model.description?.toLowerCase().includes(queryLower)
        );
      }

      return popularModels;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to search library models: ${error.message}`);
      }
      throw new Error('Failed to search library models: Unknown error');
    }
  }

  /**
   * Download a model from the Ollama library
   */
  async downloadModel(
    modelName: string,
    onProgress?: (progress: OllamaDownloadProgress) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName, stream: true }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start download: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body for download stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const progress: OllamaDownloadProgress = JSON.parse(line);
              onProgress?.(progress);

              if (progress.status === 'success') {
                return; // Download complete
              }
              
              if (progress.status === 'error') {
                throw new Error(progress.error || 'Download failed');
              }
            } catch (parseError) {
              // Ignore JSON parse errors for incomplete chunks
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to download model: ${error.message}`);
      }
      throw new Error('Failed to download model: Unknown error');
    }
  }

  /**
   * Load a model into memory (start it)
   */
  async loadModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          prompt: '', // Empty prompt just to load the model
          stream: false,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Failed to load model: ${response.status} ${response.statusText}`);
      }

      // The model is now loaded in memory
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load model: ${error.message}`);
      }
      throw new Error('Failed to load model: Unknown error');
    }
  }

  /**
   * Unload a model from memory
   */
  async unloadModel(modelName: string): Promise<void> {
    try {
      // Ollama doesn't have a direct unload API, but we can load another small model
      // or rely on Ollama's automatic memory management
      // For now, we'll consider this a no-op as Ollama manages memory automatically
      console.log(`Model ${modelName} will be unloaded automatically by Ollama when needed`);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to unload model: ${error.message}`);
      }
      throw new Error('Failed to unload model: Unknown error');
    }
  }

  /**
   * Check if a specific model is currently loaded
   */
  async getModelStatus(modelName: string): Promise<OllamaModelStatus> {
    try {
      // Test if model responds quickly to determine if it's loaded
      const startTime = Date.now();
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          prompt: 'test',
          stream: false,
          options: { num_predict: 1 },
        }),
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        // If response is very fast (< 1 second), model is likely loaded
        const status = responseTime < 1000 ? 'loaded' : 'loading';
        return {
          name: modelName,
          status,
        };
      } else {
        return {
          name: modelName,
          status: 'error',
          error: `${response.status} ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        name: modelName,
        status: 'not_loaded',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a locally installed model
   */
  async deleteModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete model: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete model: ${error.message}`);
      }
      throw new Error('Failed to delete model: Unknown error');
    }
  }

  /**
   * Get detailed information about a model
   */
  async getModelInfo(modelName: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Failed to get model info: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get model info: ${error.message}`);
      }
      throw new Error('Failed to get model info: Unknown error');
    }
  }

  /**
   * Generate text using a model (for testing purposes)
   */
  async generate(request: OllamaGenerateRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate: ${error.message}`);
      }
      throw new Error('Failed to generate: Unknown error');
    }
  }
}

// Create a singleton instance
export const ollamaService = new OllamaService();