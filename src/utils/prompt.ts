import { GitDiff, LLMProvider } from '../types';
import { CompressionLevel, ProcessedDiff } from './diffProcessor';

export function generateAdaptivePrompt(
  processedDiff: ProcessedDiff, 
  _provider: LLMProvider
): string {
  const baseInstructions = `Generate a commit message following the Conventional Commits specification.

Format: <type>[optional scope]: <description>

Common types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes  
- style: Changes that do not affect the meaning of the code
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- chore: Changes to the build process or auxiliary tools

`;

  let specificInstructions = '';
  let diffPresentation = '';

  switch (processedDiff.level) {
    case CompressionLevel.FULL:
      specificInstructions = `Analyze the detailed git diff below to understand the exact changes made. Focus on the most significant modifications and their purpose.

`;
      diffPresentation = `Git Changes:
${processedDiff.content}

`;
      break;

    case CompressionLevel.SMART:
      specificInstructions = `Below is a summary of key changes made to ${processedDiff.filesProcessed} files. Focus on the most important modifications highlighted in the summary.

`;
      diffPresentation = `Change Summary:
${processedDiff.content}

`;
      break;

    case CompressionLevel.MINIMAL:
      specificInstructions = `Based on the file modification summary below, generate an appropriate commit message that captures the overall nature of the changes.

`;
      diffPresentation = `Modification Summary:
${processedDiff.content}

`;
      break;

    case CompressionLevel.EXTREME:
      specificInstructions = `Based on the basic file statistics below, generate a general commit message. Since detailed changes aren't available, focus on the scope and scale of modifications.

`;
      diffPresentation = `File Statistics:
${processedDiff.content}

`;
      break;
  }

  const responseGuidance = `Please provide only the commit message without any additional explanation or formatting. The message should be clear, concise, and accurately describe the changes made based on the ${processedDiff.level} information provided.`;

  return baseInstructions + specificInstructions + diffPresentation + responseGuidance;
}

export function generateSystemPrompt(compressionLevel: CompressionLevel): string {
  const basePrompt = `You are an AI assistant specialized in generating git commit messages following the Conventional Commits specification.

Your task is to analyze git changes and create clear, concise commit messages that accurately describe the changes made. Focus on:
1. Using the appropriate conventional commit type
2. Writing clear and descriptive commit messages
3. Including scope when relevant
4. Keeping the description under 72 characters when possible
5. Adding body text for complex changes when necessary

`;

  let specificGuidance = '';

  switch (compressionLevel) {
    case CompressionLevel.FULL:
      specificGuidance = `You will receive detailed git diffs. Analyze the code changes carefully to understand the intent and impact of modifications.`;
      break;
    case CompressionLevel.SMART:
      specificGuidance = `You will receive intelligent summaries of changes highlighting key modifications. Focus on the most important changes to determine the commit type and scope.`;
      break;
    case CompressionLevel.MINIMAL:
      specificGuidance = `You will receive basic file modification information. Infer the nature of changes from file types and statistics provided.`;
      break;
    case CompressionLevel.EXTREME:
      specificGuidance = `You will receive only high-level statistics. Generate a general but appropriate commit message based on the scale and scope indicated.`;
      break;
  }

  return basePrompt + specificGuidance + `

Always respond with just the commit message, no additional formatting or explanation.`;
}

// Legacy function for backward compatibility
export function generateCommitPrompt(diffs: GitDiff[]): string {
  const diffSummary = diffs.map(diff => `
File: ${diff.file}
Changes:
${diff.changes}
`).join('\n---\n');

  return `Please analyze the following git diff and generate a commit message following the Conventional Commits specification.

The commit message should follow this format:
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

Common types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- chore: Changes to the build process or auxiliary tools

Git diff:
${diffSummary}

Please provide only the commit message without any additional explanation or formatting. The message should be clear, concise, and accurately describe the changes made.`;
}