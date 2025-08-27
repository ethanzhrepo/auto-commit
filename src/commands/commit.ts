import chalk from 'chalk';
import { GitManager } from '../utils/git';
import { loadConfig } from '../utils/config';
import { generateCommitPrompt } from '../utils/prompt';
import { generateCommitMessage } from '../providers';

export async function commitCommand(): Promise<void> {
  try {
    // Check if current directory is a git repository
    const git = new GitManager();
    const isGitRepo = await git.isGitRepository();
    
    if (!isGitRepo) {
      console.error(chalk.red('❌ Error: Not a git repository'));
      console.log(chalk.yellow('Please run this command in a git repository directory.'));
      process.exit(1);
    }

    // Check if there are staged changes
    const hasStagedChanges = await git.hasStagedChanges();
    
    if (!hasStagedChanges) {
      console.log(chalk.yellow('⚠️  No staged changes found.'));
      console.log(chalk.blue('Use `git add <files>` to stage files before running auto-commit.'));
      process.exit(0);
    }

    // Load configuration
    const config = await loadConfig();
    
    if (!config) {
      console.error(chalk.red('❌ No configuration found.'));
      console.log(chalk.blue('Please run `auto-commit config` to configure the tool first.'));
      process.exit(1);
    }

    console.log(chalk.blue('🔍 Analyzing staged changes...'));

    // Get staged changes
    const stagedChanges = await git.getStagedChanges();
    
    if (stagedChanges.length === 0) {
      console.log(chalk.yellow('⚠️  No staged changes to analyze.'));
      process.exit(0);
    }

    // Generate prompt for LLM
    const prompt = generateCommitPrompt(stagedChanges);
    
    console.log(chalk.blue('🤖 Generating commit message using AI...'));
    console.log(chalk.dim(`Provider: ${config.provider}`));
    console.log(chalk.dim(`Model: ${config.model}`));

    // Generate commit message using AI
    const response = await generateCommitMessage(config, prompt);
    
    if (response.error) {
      console.error(chalk.red('❌ Failed to generate commit message:'));
      console.error(chalk.red(response.error));
      process.exit(1);
    }

    if (!response.message) {
      console.error(chalk.red('❌ Empty commit message generated.'));
      process.exit(1);
    }

    const commitMessage = response.message;
    
    console.log(chalk.green('✅ Generated commit message:'));
    console.log(chalk.cyan(`"${commitMessage}"`));

    // Ask for confirmation
    const inquirer = await import('inquirer');
    const { confirm } = await inquirer.default.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to commit with this message?',
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Commit cancelled.'));
      return;
    }

    // Perform the commit
    console.log(chalk.blue('📝 Committing changes...'));
    
    await git.commit(commitMessage);
    
    console.log(chalk.green('✅ Successfully committed changes!'));
    console.log(chalk.dim(`Commit message: "${commitMessage}"`));

  } catch (error) {
    console.error(chalk.red('❌ Error during commit process:'), error);
    process.exit(1);
  }
}