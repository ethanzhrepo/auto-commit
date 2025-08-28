import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { Ollama } from 'ollama';
import { Config, LLMProvider, ProviderResponse } from '../types';

export interface ProviderInfo {
  name: string;
  displayName: string;
  models: string[];
  requiresApiKey: boolean;
}

export const PROVIDER_CONFIGS: Record<LLMProvider, ProviderInfo> = {
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    requiresApiKey: true
  },
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic (Claude)',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
    requiresApiKey: true
  },
  google: {
    name: 'google',
    displayName: 'Google (Gemini)',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    requiresApiKey: true
  },
  deepseek: {
    name: 'deepseek',
    displayName: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder'],
    requiresApiKey: true
  },
  qwen: {
    name: 'qwen',
    displayName: 'Qwen (通义千问)',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    requiresApiKey: true
  },
  ollama: {
    name: 'ollama',
    displayName: 'Ollama (Local)',
    models: [], // Will be fetched dynamically
    requiresApiKey: false
  }
};

export async function getAvailableModels(provider: LLMProvider, apiKey?: string): Promise<string[]> {
  const config = PROVIDER_CONFIGS[provider];
  
  try {
    switch (provider) {
      case 'openai':
        return await fetchOpenAIModels(apiKey);
        
      case 'anthropic':
        return await fetchAnthropicModels(apiKey);
        
      case 'google':
        return await fetchGoogleModels(apiKey);
        
      case 'deepseek':
        return await fetchDeepSeekModels(apiKey);
        
      case 'qwen':
        // Qwen models are fixed, return predefined list
        return config.models;
        
      case 'ollama':
        return await fetchOllamaModels();
        
      default:
        return config.models;
    }
  } catch (error) {
    console.warn(`Failed to fetch ${provider} models, using default list:`, error);
    return config.models;
  }
}

async function fetchOpenAIModels(apiKey?: string): Promise<string[]> {
  if (!apiKey) return PROVIDER_CONFIGS.openai.models;
  
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data: any = await response.json();
  return data.data
    .filter((model: any) => model.id.includes('gpt'))
    .map((model: any) => model.id)
    .sort();
}

async function fetchDeepSeekModels(apiKey?: string): Promise<string[]> {
  if (!apiKey) return PROVIDER_CONFIGS.deepseek.models;
  
  const response = await fetch('https://api.deepseek.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data: any = await response.json();
  return data.data.map((model: any) => model.id).sort();
}

async function fetchAnthropicModels(apiKey?: string): Promise<string[]> {
  if (!apiKey) return PROVIDER_CONFIGS.anthropic.models;
  
  const response = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data: any = await response.json();
  return data.data.map((model: any) => model.id).sort();
}

async function fetchGoogleModels(apiKey?: string): Promise<string[]> {
  if (!apiKey) return PROVIDER_CONFIGS.google.models;
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data: any = await response.json();
  const models = data.models
    .filter((model: any) => model.supportedGenerationMethods?.includes('generateContent'))
    .map((model: any) => {
      // Some models come with 'models/' prefix, remove it
      const modelName = model.name.replace('models/', '');
      return modelName;
    })
    .sort();
  
  // Debug: log the available models
  console.log('Available Google models:', models);
  return models;
}

async function fetchOllamaModels(): Promise<string[]> {
  const ollamaClient = new Ollama();
  const response = await ollamaClient.list();
  return response.models.map((model: any) => model.name);
}

export function getMaxTokensForProvider(provider: LLMProvider): number {
  const limits = {
    openai: 4096,      // Conservative limit for GPT models
    anthropic: 8192,   // Claude models support more
    google: 50000,     // Gemini supports very large outputs
    deepseek: 4096,    // Similar to OpenAI
    qwen: 4096,        // Similar to OpenAI
    ollama: 2048       // Conservative for local models
  };
  
  return limits[provider] || 4096;
}

export async function generateCommitMessage(config: Config, prompt: string): Promise<ProviderResponse> {
  try {
    let model: any;
    
    // Set API key in environment
    if (config.apiKey) {
      process.env.OPENAI_API_KEY = config.apiKey;
      process.env.ANTHROPIC_API_KEY = config.apiKey;
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = config.apiKey;
    }
    
    const maxTokens = getMaxTokensForProvider(config.provider);
    
    switch (config.provider) {
      case 'openai':
        model = openai(config.model);
        break;
        
      case 'anthropic':
        model = anthropic(config.model);
        break;
        
      case 'google':
        model = google(config.model);
        break;
        
      case 'deepseek':
        // For now, use a default OpenAI model for DeepSeek
        // In production, you'd need to implement custom provider
        process.env.OPENAI_API_KEY = config.apiKey;
        model = openai('gpt-3.5-turbo');
        break;
        
      case 'qwen':
        // For now, use a default OpenAI model for Qwen
        // In production, you'd need to implement custom provider
        process.env.OPENAI_API_KEY = config.apiKey;
        model = openai('gpt-3.5-turbo');
        break;
        
      case 'ollama':
        // For Ollama, we'll use a custom implementation
        return await generateWithOllama(config.model, prompt);
        
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    const { text } = await generateText({
      model,
      prompt,
      maxTokens,
      temperature: 0.1,
    });

    return { message: text.trim() };
    
  } catch (error) {
    console.error('Detailed error:', error);
    return {
      message: '',
      error: `Failed to generate commit message: ${error}`
    };
  }
}

async function generateWithOllama(model: string, prompt: string): Promise<ProviderResponse> {
  try {
    const ollamaClient = new Ollama();
    
    const response = await ollamaClient.chat({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant specialized in generating git commit messages following the Conventional Commits specification. Respond with only the commit message, no additional formatting or explanation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      options: {
        temperature: 0.3,
      }
    });

    return { message: response.message.content.trim() };
    
  } catch (error) {
    return {
      message: '',
      error: `Ollama error: ${error}`
    };
  }
}