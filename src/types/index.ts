export interface Config {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'qwen' | 'ollama';

export interface LLMProviderConfig {
  name: string;
  displayName: string;
  baseUrl?: string;
  models: string[];
}

export interface GitDiff {
  file: string;
  changes: string;
}

export interface CommitMessage {
  type: string;
  scope?: string;
  description: string;
  body?: string;
  breaking?: boolean;
}

export interface ProviderResponse {
  message: string;
  error?: string;
}