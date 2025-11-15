import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelPricing {
  promptTokenPriceUsd: number;
  completionTokenPriceUsd: number;
}

// OpenRouter model identifiers and pricing
export const MODELS = {
  // Anthropic Claude models
  SONNET_4_5: 'anthropic/claude-sonnet-4.5',
  SONNET_3_7: 'anthropic/claude-3.7-sonnet',
  SONNET_3_5: 'anthropic/claude-3.5-sonnet',
  HAIKU_3_5: 'anthropic/claude-3.5-haiku',
  OPUS_3: 'anthropic/claude-3-opus',

  // Vision-capable models
  SONNET_4_5_VISION: 'anthropic/claude-sonnet-4.5',
  GPT_4_VISION: 'openai/gpt-4-vision-preview',
} as const;

// Model pricing (per million tokens)
export const MODEL_PRICING: Record<string, ModelPricing> = {
  [MODELS.SONNET_4_5]: {
    promptTokenPriceUsd: 3.0 / 1_000_000,
    completionTokenPriceUsd: 15.0 / 1_000_000,
  },
  [MODELS.SONNET_3_7]: {
    promptTokenPriceUsd: 3.0 / 1_000_000,
    completionTokenPriceUsd: 15.0 / 1_000_000,
  },
  [MODELS.SONNET_3_5]: {
    promptTokenPriceUsd: 3.0 / 1_000_000,
    completionTokenPriceUsd: 15.0 / 1_000_000,
  },
  [MODELS.HAIKU_3_5]: {
    promptTokenPriceUsd: 1.0 / 1_000_000,
    completionTokenPriceUsd: 5.0 / 1_000_000,
  },
  [MODELS.OPUS_3]: {
    promptTokenPriceUsd: 15.0 / 1_000_000,
    completionTokenPriceUsd: 75.0 / 1_000_000,
  },
};

export interface AICallMetadata {
  projectId?: string;
  userId?: string;
  taskType: string;
  phase: string;
  artifactId?: string;
}

export interface AICallResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  durationMs: number;
  model: string;
  cached: boolean;
}

export class OpenRouterClient {
  private client: AxiosInstance;
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel: string = MODELS.SONNET_4_5) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    this.defaultModel = defaultModel;

    if (!this.apiKey) {
      logger.warn('OpenRouter API key not provided. AI features will be disabled.');
    }

    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'https://vocabotics.com',
        'X-Title': 'Vocabotics',
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2 minutes
    });
  }

  /**
   * Calculate cost based on token usage and model pricing
   */
  private calculateCost(
    promptTokens: number,
    completionTokens: number,
    model: string
  ): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) {
      logger.warn(`No pricing found for model: ${model}`);
      return 0;
    }

    const promptCost = promptTokens * pricing.promptTokenPriceUsd;
    const completionCost = completionTokens * pricing.completionTokenPriceUsd;

    return promptCost + completionCost;
  }

  /**
   * Make a completion request to OpenRouter
   */
  async complete(
    request: OpenRouterRequest,
    metadata?: AICallMetadata
  ): Promise<AICallResult> {
    const startTime = Date.now();

    try {
      // Use provided model or default
      const model = request.model || this.defaultModel;

      logger.info('OpenRouter API call', {
        model,
        messageCount: request.messages.length,
        taskType: metadata?.taskType,
        phase: metadata?.phase,
      });

      const response = await this.client.post<OpenRouterResponse>('/chat/completions', {
        ...request,
        model,
      });

      const durationMs = Date.now() - startTime;
      const { usage, choices } = response.data;

      // Calculate cost
      const costUsd = this.calculateCost(
        usage.prompt_tokens,
        usage.completion_tokens,
        model
      );

      // Check if response was cached (OpenRouter returns this in headers)
      const cached = response.headers['x-cached'] === 'true';

      const result: AICallResult = {
        content: choices[0].message.content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        costUsd,
        durationMs,
        model,
        cached,
      };

      logger.info('OpenRouter API response', {
        model,
        durationMs,
        tokens: usage.total_tokens,
        costUsd: costUsd.toFixed(4),
        cached,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        logger.error('OpenRouter API error', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message,
          durationMs,
        });

        throw new Error(
          error.response?.data?.error?.message ||
          `OpenRouter API error: ${error.message}`
        );
      }

      logger.error('Unexpected error calling OpenRouter', {
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs,
      });

      throw error;
    }
  }

  /**
   * Stream completion (for future real-time UI updates)
   * Currently returns promise but can be enhanced for SSE
   */
  async streamComplete(
    request: OpenRouterRequest,
    metadata?: AICallMetadata
  ): Promise<AICallResult> {
    // For now, just use regular completion
    // In future, implement SSE streaming with OpenRouter
    return this.complete(request, metadata);
  }

  /**
   * Validate API key
   */
  async validateKey(): Promise<boolean> {
    try {
      await this.client.get('/models');
      return true;
    } catch (error) {
      logger.error('Failed to validate OpenRouter API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<any[]> {
    try {
      const response = await this.client.get('/models');
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to fetch OpenRouter models', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Create a new client with a different API key (for BYOK)
   */
  static withKey(apiKey: string, defaultModel?: string): OpenRouterClient {
    return new OpenRouterClient(apiKey, defaultModel);
  }
}

// Export singleton instance for default usage
export const openRouterClient = new OpenRouterClient();
