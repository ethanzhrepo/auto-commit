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

export async function getAvailableModels(provider: LLMProvider, _apiKey?: string): Promise<string[]> {
  const config = PROVIDER_CONFIGS[provider];
  
  if (provider === 'ollama') {
    try {
      const ollamaClient = new Ollama();
      const response = await ollamaClient.list();
      return response.models.map((model: any) => model.name);
    } catch (error) {
      console.warn('Failed to fetch Ollama models:', error);
      return ['llama2', 'codellama', 'mistral'];
    }
  }
  
  // For other providers, return default models
  // In a production app, you might want to fetch actual available models from API
  return config.models;
}

export async function generateCommitMessage(config: Config, prompt: string): Promise<ProviderResponse> {
  try {
    let model: any;
    
    // Set API key in environment
    if (config.apiKey) {
      process.env.OPENAI_API_KEY = config.apiKey;
      process.env.ANTHROPIC_API_KEY = config.apiKey;
      process.env.GOOGLE_API_KEY = config.apiKey;
    }
    
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
      maxTokens: 200,
      temperature: 0.3,
    });

    return { message: text.trim() };
    
  } catch (error) {
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