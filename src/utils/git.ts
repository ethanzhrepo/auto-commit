import simpleGit, { SimpleGit } from 'simple-git';
import { GitDiff } from '../types';

export class GitManager {
  private git: SimpleGit;

  constructor(baseDir?: string) {
    this.git = simpleGit(baseDir);
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.checkIsRepo();
      return true;
    } catch {
      return false;
    }
  }

  async getStagedChanges(): Promise<GitDiff[]> {
    try {
      const status = await this.git.status();
      const stagedFiles = status.staged;
      
      if (stagedFiles.length === 0) {
        return [];
      }

      const diffs: GitDiff[] = [];
      for (const file of stagedFiles) {
        try {
          const diff = await this.git.diff(['--cached', file]);
          diffs.push({
            file,
            changes: diff
          });
        } catch (error) {
          console.warn(`Failed to get diff for file: ${file}`, error);
        }
      }

      return diffs;
    } catch (error) {
      throw new Error(`Failed to get staged changes: ${error}`);
    }
  }

  async commit(message: string): Promise<void> {
    try {
      await this.git.commit(message);
    } catch (error) {
      throw new Error(`Failed to commit: ${error}`);
    }
  }

  async hasStagedChanges(): Promise<boolean> {
    try {
      const status = await this.git.status();
      return status.staged.length > 0;
    } catch {
      return false;
    }
  }
}