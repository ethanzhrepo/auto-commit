import { GitDiff, LLMProvider } from '../types';
import { TokenEstimator } from './tokenEstimator';

export enum CompressionLevel {
  FULL = 'full',           // Strategy 1: Complete diff
  SMART = 'smart',         // Strategy 2: Intelligent summary  
  MINIMAL = 'minimal',     // Strategy 3: File names + stats
  EXTREME = 'extreme'      // Strategy 4: Just count + stats
}

export interface ProcessedDiff {
  content: string;
  level: CompressionLevel;
  tokenCount: number;
  filesProcessed: number;
  filesSkipped: number;
}

export interface KeyChange {
  type: 'added' | 'removed' | 'modified';
  content: string;
  importance: number; // 1-5, 5 being most important
}

export class DiffProcessor {
  private tokenEstimator: TokenEstimator;
  
  constructor() {
    this.tokenEstimator = TokenEstimator.getInstance();
  }
  
  // Extract key changes from diff content
  private extractKeyChanges(diff: GitDiff): KeyChange[] {
    const lines = diff.changes.split('\n');
    const changes: KeyChange[] = [];
    
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const content = line.slice(1).trim();
        const importance = this.calculateImportance(content, 'added');
        if (importance >= 3) { // Only keep important changes
          changes.push({ type: 'added', content, importance });
        }
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        const content = line.slice(1).trim();
        const importance = this.calculateImportance(content, 'removed');
        if (importance >= 3) {
          changes.push({ type: 'removed', content, importance });
        }
      }
    }
    
    // Sort by importance and return top 5
    return changes
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);
  }
  
  private calculateImportance(content: string, _type: 'added' | 'removed'): number {
    let importance = 1;
    
    // Function/class definitions are very important
    if (content.match(/^\s*(function|class|def|interface|type|enum)\s+\w/i)) {
      importance = 5;
    }
    // Import/export statements
    else if (content.match(/^\s*(import|export|from|require)\s/i)) {
      importance = 4;
    }
    // Constants and configurations
    else if (content.match(/^\s*(const|let|var|final|static)\s+[A-Z_][A-Z0-9_]*\s*=/i)) {
      importance = 4;
    }
    // API endpoints and URLs
    else if (content.match(/(https?:\/\/|\/api\/|endpoint|route)/i)) {
      importance = 4;
    }
    // Package.json changes
    else if (content.match(/^\s*"(name|version|dependencies|scripts)"\s*:/)) {
      importance = 4;
    }
    // Comments are less important
    else if (content.match(/^\s*(\/\/|#|\/\*|\*)/)) {
      importance = 1;
    }
    // Empty lines
    else if (!content.trim()) {
      importance = 0;
    }
    // Regular code changes
    else if (content.trim()) {
      importance = 2;
    }
    
    return importance;
  }
  
  private getFileStats(diff: GitDiff): { added: number; removed: number } {
    const lines = diff.changes.split('\n');
    let added = 0, removed = 0;
    
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) added++;
      else if (line.startsWith('-') && !line.startsWith('---')) removed++;
    }
    
    return { added, removed };
  }
  
  private categorizeFile(filename: string): 'core' | 'config' | 'test' | 'docs' | 'other' {
    const lower = filename.toLowerCase();
    
    if (lower.match(/\.(test|spec)\.(js|ts|py|go|rs|java|php)$/)) return 'test';
    if (lower.match(/\.(md|txt|rst|adoc)$/)) return 'docs';
    if (lower.match(/(package\.json|cargo\.toml|requirements\.txt|setup\.py|dockerfile|\.env|config\.|\.config|\.yaml|\.yml|\.toml|\.ini)$/i)) return 'config';
    if (lower.match(/\.(js|ts|py|go|rs|java|php|cpp|c|h|cs|rb|swift|kt)$/)) return 'core';
    
    return 'other';
  }
  
  // Strategy 1: Full diff
  private async processFullDiff(diffs: GitDiff[], _provider: LLMProvider): Promise<string> {
    const content = diffs.map(diff => `
File: ${diff.file}
Changes:
${diff.changes}
---`).join('\n');
    
    return content;
  }
  
  // Strategy 2: Smart summary
  private async processSmartSummary(diffs: GitDiff[], _provider: LLMProvider): Promise<string> {
    const summaries: string[] = [];
    
    for (const diff of diffs) {
      const stats = this.getFileStats(diff);
      const keyChanges = this.extractKeyChanges(diff);
      const category = this.categorizeFile(diff.file);
      
      let summary = `File: ${diff.file} [${category}] (+${stats.added} -${stats.removed})`;
      
      if (keyChanges.length > 0) {
        summary += '\nKey changes:';
        for (const change of keyChanges) {
          const prefix = change.type === 'added' ? '+' : '-';
          summary += `\n  ${prefix} ${change.content}`;
        }
      }
      
      summaries.push(summary);
    }
    
    return summaries.join('\n---\n');
  }
  
  // Strategy 3: Minimal info
  private async processMinimal(diffs: GitDiff[], _provider: LLMProvider): Promise<string> {
    const categories = { core: 0, config: 0, test: 0, docs: 0, other: 0 };
    let totalAdded = 0, totalRemoved = 0;
    
    for (const diff of diffs) {
      const category = this.categorizeFile(diff.file);
      categories[category]++;
      
      const stats = this.getFileStats(diff);
      totalAdded += stats.added;
      totalRemoved += stats.removed;
    }
    
    const parts: string[] = [];
    if (categories.core > 0) parts.push(`${categories.core} core files`);
    if (categories.config > 0) parts.push(`${categories.config} config files`);
    if (categories.test > 0) parts.push(`${categories.test} test files`);
    if (categories.docs > 0) parts.push(`${categories.docs} documentation files`);
    if (categories.other > 0) parts.push(`${categories.other} other files`);
    
    return `Modified: ${parts.join(', ')} (+${totalAdded} -${totalRemoved} lines)`;
  }
  
  // Strategy 4: Extreme compression
  private async processExtreme(diffs: GitDiff[], _provider: LLMProvider): Promise<string> {
    let totalAdded = 0, totalRemoved = 0;
    
    for (const diff of diffs) {
      const stats = this.getFileStats(diff);
      totalAdded += stats.added;
      totalRemoved += stats.removed;
    }
    
    return `Modified ${diffs.length} files (+${totalAdded} -${totalRemoved} lines)`;
  }
  
  public async processDiffs(
    diffs: GitDiff[], 
    maxTokens: number, 
    provider: LLMProvider,
    reservedTokens: number = 600 // Reserve for system prompt + response
  ): Promise<ProcessedDiff> {
    
    const availableTokens = maxTokens - reservedTokens;
    
    // Try strategies in order of preference
    const strategies = [
      { level: CompressionLevel.FULL, processor: this.processFullDiff.bind(this) },
      { level: CompressionLevel.SMART, processor: this.processSmartSummary.bind(this) },
      { level: CompressionLevel.MINIMAL, processor: this.processMinimal.bind(this) },
      { level: CompressionLevel.EXTREME, processor: this.processExtreme.bind(this) }
    ];
    
    for (const strategy of strategies) {
      const content = await strategy.processor(diffs, provider);
      const tokenCount = await this.tokenEstimator.countTokens(content, provider);
      
      if (tokenCount <= availableTokens || strategy.level === CompressionLevel.EXTREME) {
        return {
          content,
          level: strategy.level,
          tokenCount,
          filesProcessed: diffs.length,
          filesSkipped: 0
        };
      }
    }
    
    // This shouldn't happen, but fallback to extreme
    const content = await this.processExtreme(diffs, provider);
    const tokenCount = await this.tokenEstimator.countTokens(content, provider);
    
    return {
      content,
      level: CompressionLevel.EXTREME,
      tokenCount,
      filesProcessed: diffs.length,
      filesSkipped: 0
    };
  }
}