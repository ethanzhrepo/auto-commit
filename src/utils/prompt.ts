import { GitDiff } from '../types';

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

export function generateSystemPrompt(): string {
  return `You are an AI assistant specialized in generating git commit messages following the Conventional Commits specification. 

Your task is to analyze git diffs and create clear, concise commit messages that accurately describe the changes made. Focus on:
1. Using the appropriate conventional commit type
2. Writing clear and descriptive commit messages
3. Including scope when relevant
4. Keeping the description under 72 characters when possible
5. Adding body text for complex changes when necessary

Always respond with just the commit message, no additional formatting or explanation.`;
}