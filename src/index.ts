#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { configureCommand } from './commands/config';
import { commitCommand } from './commands/commit';

const program = new Command();

program
  .name('auto-commit')
  .description('AI-powered git commit message generator')
  .version('1.0.0');

// Default action for auto-commit (without subcommands)
program
  .action(async () => {
    await commitCommand();
  });

// Config subcommand
program
  .command('config')
  .description('configure LLM provider and settings')
  .action(async () => {
    await configureCommand();
  });

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

program.parse();