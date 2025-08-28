import { AutoTokenizer } from '@xenova/transformers';
import { LLMProvider } from '../types';

interface TokenizerCache {
  [key: string]: any;
}

export class TokenEstimator {
  private static instance: TokenEstimator;
  private tokenizerCache: TokenizerCache = {};
  
  private constructor() {}
  
  public static getInstance(): TokenEstimator {
    if (!TokenEstimator.instance) {
      TokenEstimator.instance = new TokenEstimator();
    }
    return TokenEstimator.instance;
  }
  
  private getTokenizerModel(provider: LLMProvider): string {
    const tokenizerMap = {
      openai: 'Xenova/gpt-4o',
      anthropic: 'Xenova/claude-tokenizer', 
      google: 'Xenova/gpt-4o', // Use GPT tokenizer as fallback for Gemini
      deepseek: 'Xenova/gpt-4o', // OpenAI compatible
      qwen: 'Xenova/gpt-4o', // OpenAI compatible  
      ollama: 'Xenova/gpt-4o' // Use GPT tokenizer as fallback
    };
    
    return tokenizerMap[provider] || 'Xenova/gpt-4o';
  }
  
  private async getTokenizer(provider: LLMProvider): Promise<any> {
    const model = this.getTokenizerModel(provider);
    
    if (!this.tokenizerCache[model]) {
      try {
        console.log(`Loading tokenizer: ${model}`);
        this.tokenizerCache[model] = await AutoTokenizer.from_pretrained(model);
      } catch (error) {
        console.warn(`Failed to load tokenizer ${model}, using fallback:`, error);
        // Fallback to GPT-4o tokenizer
        if (model !== 'Xenova/gpt-4o') {
          this.tokenizerCache[model] = await AutoTokenizer.from_pretrained('Xenova/gpt-4o');
        } else {
          throw error;
        }
      }
    }
    
    return this.tokenizerCache[model];
  }
  
  public async countTokens(text: string, provider: LLMProvider): Promise<number> {
    try {
      const tokenizer = await this.getTokenizer(provider);
      const tokens = await tokenizer.encode(text);
      return tokens.length;
    } catch (error) {
      console.warn('Token counting failed, using approximation:', error);
      // Fallback to approximation: 1 token ≈ 4 characters
      return Math.ceil(text.length / 4);
    }
  }
  
  public async estimateTokens(texts: string[], provider: LLMProvider): Promise<number> {
    const fullText = texts.join('\n');
    return this.countTokens(fullText, provider);
  }
  
  // Batch processing for efficiency
  public async countTokensBatch(texts: string[], provider: LLMProvider): Promise<number[]> {
    const tokenizer = await this.getTokenizer(provider);
    const results: number[] = [];
    
    for (const text of texts) {
      try {
        const tokens = await tokenizer.encode(text);
        results.push(tokens.length);
      } catch (error) {
        console.warn('Batch token counting failed for text, using approximation:', error);
        results.push(Math.ceil(text.length / 4));
      }
    }
    
    return results;
  }
  
  // Clear cache to free memory
  public clearCache(): void {
    this.tokenizerCache = {};
  }
}