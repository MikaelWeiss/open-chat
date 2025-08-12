// Model capabilities detection service for local models
export interface ModelCapabilities {
  vision: boolean;
  functionCalling: boolean;
  tools: boolean;
  codeGeneration: boolean;
  multimodal: boolean;
  reasoning: boolean;
  mathematics: boolean;
  languages: string[];
  contextLength: number;
  parameterCount?: string;
  quantization?: string;
}

export interface ModelFamily {
  name: string;
  patterns: string[];
  capabilities: ModelCapabilities;
  description: string;
  provider: string;
}

// Comprehensive model family database based on Ollama model ecosystem
const MODEL_FAMILIES: ModelFamily[] = [
  // Llama 3.2 family - Vision capable
  {
    name: 'Llama 3.2',
    patterns: ['llama3.2', 'llama-3.2', 'llama32'],
    capabilities: {
      vision: true,
      functionCalling: true,
      tools: true,
      codeGeneration: true,
      multimodal: true,
      reasoning: true,
      mathematics: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'hi', 'th'],
      contextLength: 128000,
      parameterCount: '1B-90B',
    },
    description: 'Meta\'s latest multimodal model with vision and reasoning capabilities',
    provider: 'Meta',
  },

  // Llama 3.1 family - Function calling
  {
    name: 'Llama 3.1',
    patterns: ['llama3.1', 'llama-3.1', 'llama31'],
    capabilities: {
      vision: false,
      functionCalling: true,
      tools: true,
      codeGeneration: true,
      multimodal: false,
      reasoning: true,
      mathematics: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'hi', 'th'],
      contextLength: 128000,
      parameterCount: '8B-405B',
    },
    description: 'Meta\'s Llama 3.1 with function calling and tool use',
    provider: 'Meta',
  },

  // Llama 3 base family
  {
    name: 'Llama 3',
    patterns: ['llama3:', 'llama-3:', 'llama3-'],
    capabilities: {
      vision: false,
      functionCalling: false,
      tools: false,
      codeGeneration: true,
      multimodal: false,
      reasoning: true,
      mathematics: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
      contextLength: 8192,
      parameterCount: '8B-70B',
    },
    description: 'Meta\'s Llama 3 base model family',
    provider: 'Meta',
  },

  // LLaVA family - Vision models
  {
    name: 'LLaVA',
    patterns: ['llava', 'llava-'],
    capabilities: {
      vision: true,
      functionCalling: false,
      tools: false,
      codeGeneration: false,
      multimodal: true,
      reasoning: true,
      mathematics: false,
      languages: ['en'],
      contextLength: 4096,
      parameterCount: '7B-34B',
    },
    description: 'Large Language and Vision Assistant for multimodal tasks',
    provider: 'Microsoft',
  },

  // Qwen2-VL family - Vision models
  {
    name: 'Qwen2-VL',
    patterns: ['qwen2-vl', 'qwen2vl', 'qwen-vl'],
    capabilities: {
      vision: true,
      functionCalling: true,
      tools: true,
      codeGeneration: true,
      multimodal: true,
      reasoning: true,
      mathematics: true,
      languages: ['en', 'zh', 'ja', 'ko'],
      contextLength: 32768,
      parameterCount: '2B-72B',
    },
    description: 'Alibaba\'s vision-language model with strong multimodal capabilities',
    provider: 'Alibaba',
  },

  // Code Llama family - Code generation
  {
    name: 'Code Llama',
    patterns: ['codellama', 'code-llama', 'code_llama'],
    capabilities: {
      vision: false,
      functionCalling: false,
      tools: false,
      codeGeneration: true,
      multimodal: false,
      reasoning: true,
      mathematics: true,
      languages: ['en'],
      contextLength: 16384,
      parameterCount: '7B-34B',
    },
    description: 'Meta\'s specialized code generation model',
    provider: 'Meta',
  },

  // Dolphin family - Enhanced instruction following and function calling
  {
    name: 'Dolphin',
    patterns: ['dolphin'],
    capabilities: {
      vision: false,
      functionCalling: true,
      tools: true,
      codeGeneration: true,
      multimodal: false,
      reasoning: true,
      mathematics: true,
      languages: ['en'],
      contextLength: 8192,
      parameterCount: '7B-70B',
    },
    description: 'Enhanced models with improved instruction following and tool use',
    provider: 'Cognitive Computations',
  },

  // Granite family - IBM's models with function calling
  {
    name: 'Granite',
    patterns: ['granite'],
    capabilities: {
      vision: false,
      functionCalling: true,
      tools: true,
      codeGeneration: true,
      multimodal: false,
      reasoning: true,
      mathematics: true,
      languages: ['en'],
      contextLength: 8192,
      parameterCount: '3B-34B',
    },
    description: 'IBM\'s Granite models with enterprise features',
    provider: 'IBM',
  },

  // Phi-3 family - Microsoft's small but capable models
  {
    name: 'Phi-3',
    patterns: ['phi3', 'phi-3'],
    capabilities: {
      vision: false,
      functionCalling: false,
      tools: false,
      codeGeneration: true,
      multimodal: false,
      reasoning: true,
      mathematics: true,
      languages: ['en'],
      contextLength: 4096,
      parameterCount: '3.8B-14B',
    },
    description: 'Microsoft\'s small language model with strong performance',
    provider: 'Microsoft',
  },

  // Mistral family
  {
    name: 'Mistral',
    patterns: ['mistral', 'mixtral'],
    capabilities: {
      vision: false,
      functionCalling: true,
      tools: true,
      codeGeneration: true,
      multimodal: false,
      reasoning: true,
      mathematics: true,
      languages: ['en', 'fr', 'de', 'es', 'it'],
      contextLength: 32768,
      parameterCount: '7B-8x22B',
    },
    description: 'Mistral AI\'s efficient and capable language models',
    provider: 'Mistral AI',
  },

  // Gemma family - Google's models
  {
    name: 'Gemma',
    patterns: ['gemma'],
    capabilities: {
      vision: false,
      functionCalling: false,
      tools: false,
      codeGeneration: true,
      multimodal: false,
      reasoning: true,
      mathematics: true,
      languages: ['en'],
      contextLength: 8192,
      parameterCount: '2B-27B',
    },
    description: 'Google\'s Gemma family of lightweight models',
    provider: 'Google',
  },

  // Nous Hermes family - Enhanced reasoning
  {
    name: 'Nous Hermes',
    patterns: ['nous-hermes', 'hermes'],
    capabilities: {
      vision: false,
      functionCalling: true,
      tools: true,
      codeGeneration: true,
      multimodal: false,
      reasoning: true,
      mathematics: true,
      languages: ['en'],
      contextLength: 8192,
      parameterCount: '7B-70B',
    },
    description: 'Nous Research\'s enhanced reasoning models',
    provider: 'Nous Research',
  },

  // Orca family - Microsoft's reasoning models
  {
    name: 'Orca',
    patterns: ['orca'],
    capabilities: {
      vision: false,
      functionCalling: false,
      tools: false,
      codeGeneration: false,
      multimodal: false,
      reasoning: true,
      mathematics: true,
      languages: ['en'],
      contextLength: 4096,
      parameterCount: '3B-13B',
    },
    description: 'Microsoft\'s Orca models focused on reasoning',
    provider: 'Microsoft',
  },

  // Solar family - Upstage's models
  {
    name: 'Solar',
    patterns: ['solar'],
    capabilities: {
      vision: false,
      functionCalling: false,
      tools: false,
      codeGeneration: true,
      multimodal: false,
      reasoning: true,
      mathematics: true,
      languages: ['en', 'ko'],
      contextLength: 4096,
      parameterCount: '10.7B',
    },
    description: 'Upstage\'s Solar models with strong performance',
    provider: 'Upstage',
  },
];

export class ModelCapabilitiesService {
  /**
   * Detect capabilities for a given model name
   */
  static detectCapabilities(modelName: string): ModelCapabilities {
    const normalizedName = modelName.toLowerCase();
    
    // Find matching model family
    const matchingFamily = MODEL_FAMILIES.find(family =>
      family.patterns.some(pattern => 
        normalizedName.includes(pattern.toLowerCase())
      )
    );

    if (matchingFamily) {
      // Create a copy of the capabilities and potentially adjust based on specific model variants
      const capabilities = { ...matchingFamily.capabilities };
      
      // Adjust capabilities based on specific model variants
      this.adjustCapabilitiesForVariant(normalizedName, capabilities);
      
      return capabilities;
    }

    // Default capabilities for unknown models
    return this.getDefaultCapabilities();
  }

  /**
   * Get detailed information about a model family
   */
  static getModelFamilyInfo(modelName: string): ModelFamily | null {
    const normalizedName = modelName.toLowerCase();
    
    return MODEL_FAMILIES.find(family =>
      family.patterns.some(pattern => 
        normalizedName.includes(pattern.toLowerCase())
      )
    ) || null;
  }

  /**
   * Get all supported model families
   */
  static getAllModelFamilies(): ModelFamily[] {
    return [...MODEL_FAMILIES];
  }

  /**
   * Check if a model supports specific capabilities
   */
  static hasCapability(modelName: string, capability: keyof ModelCapabilities): boolean {
    const capabilities = this.detectCapabilities(modelName);
    const value = capabilities[capability];
    
    if (typeof value === 'boolean') {
      return value;
    } else if (Array.isArray(value)) {
      return value.length > 0;
    } else if (typeof value === 'number') {
      return value > 0;
    }
    
    return false;
  }

  /**
   * Get models that support vision
   */
  static getVisionCapableModels(): ModelFamily[] {
    return MODEL_FAMILIES.filter(family => family.capabilities.vision);
  }

  /**
   * Get models that support function calling
   */
  static getFunctionCallingModels(): ModelFamily[] {
    return MODEL_FAMILIES.filter(family => family.capabilities.functionCalling);
  }

  /**
   * Get models that support code generation
   */
  static getCodeGenerationModels(): ModelFamily[] {
    return MODEL_FAMILIES.filter(family => family.capabilities.codeGeneration);
  }

  /**
   * Estimate model size category based on parameter count
   */
  static getModelSizeCategory(modelName: string): 'small' | 'medium' | 'large' | 'xlarge' {
    const normalizedName = modelName.toLowerCase();
    
    if (normalizedName.includes('1b') || normalizedName.includes('2b') || normalizedName.includes('3b')) {
      return 'small';
    } else if (normalizedName.includes('7b') || normalizedName.includes('8b') || normalizedName.includes('13b')) {
      return 'medium';
    } else if (normalizedName.includes('34b') || normalizedName.includes('70b')) {
      return 'large';
    } else if (normalizedName.includes('405b') || normalizedName.includes('8x') || normalizedName.includes('mixtral')) {
      return 'xlarge';
    }
    
    // Try to infer from model family info
    const familyInfo = this.getModelFamilyInfo(modelName);
    if (familyInfo?.capabilities.parameterCount) {
      const paramCount = familyInfo.capabilities.parameterCount.toLowerCase();
      if (paramCount.includes('1b') || paramCount.includes('2b') || paramCount.includes('3b')) {
        return 'small';
      } else if (paramCount.includes('7b') || paramCount.includes('8b') || paramCount.includes('13b')) {
        return 'medium';
      } else if (paramCount.includes('34b') || paramCount.includes('70b')) {
        return 'large';
      }
    }
    
    return 'medium'; // Default assumption
  }

  private static adjustCapabilitiesForVariant(modelName: string, capabilities: ModelCapabilities): void {
    // Adjust based on specific model variants or quantization
    if (modelName.includes('vision') || modelName.includes('multimodal')) {
      capabilities.vision = true;
      capabilities.multimodal = true;
    }
    
    if (modelName.includes('instruct') || modelName.includes('chat')) {
      capabilities.reasoning = true;
    }
    
    if (modelName.includes('code') || modelName.includes('coder')) {
      capabilities.codeGeneration = true;
    }
    
    if (modelName.includes('tool') || modelName.includes('function')) {
      capabilities.functionCalling = true;
      capabilities.tools = true;
    }
    
    // Adjust context length based on model name hints
    if (modelName.includes('32k')) {
      capabilities.contextLength = 32768;
    } else if (modelName.includes('128k')) {
      capabilities.contextLength = 131072;
    } else if (modelName.includes('1m')) {
      capabilities.contextLength = 1048576;
    }
  }

  private static getDefaultCapabilities(): ModelCapabilities {
    return {
      vision: false,
      functionCalling: false,
      tools: false,
      codeGeneration: false,
      multimodal: false,
      reasoning: true, // Assume basic reasoning for any LLM
      mathematics: false,
      languages: ['en'],
      contextLength: 4096, // Conservative default
    };
  }
}

// Export singleton service
export const modelCapabilitiesService = ModelCapabilitiesService;