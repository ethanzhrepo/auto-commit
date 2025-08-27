import inquirer from 'inquirer';
import chalk from 'chalk';
import { Config, LLMProvider } from '../types';
import { saveConfig } from '../utils/config';
import { PROVIDER_CONFIGS, getAvailableModels } from '../providers';

export async function configureCommand(): Promise<void> {
  console.log(chalk.blue('🔧 Auto-commit Configuration\n'));

  try {
    // Step 1: Select LLM Provider
    const providerAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select LLM Provider:',
        choices: [
          { name: PROVIDER_CONFIGS.openai.displayName, value: 'openai' },
          { name: PROVIDER_CONFIGS.anthropic.displayName, value: 'anthropic' },
          { name: PROVIDER_CONFIGS.google.displayName, value: 'google' },
          { name: PROVIDER_CONFIGS.deepseek.displayName, value: 'deepseek' },
          { name: PROVIDER_CONFIGS.qwen.displayName, value: 'qwen' },
          { name: PROVIDER_CONFIGS.ollama.displayName, value: 'ollama' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);

    if (providerAnswer.provider === 'exit') {
      console.log(chalk.yellow('Configuration cancelled.'));
      return;
    }

    const selectedProvider: LLMProvider = providerAnswer.provider;
    const providerConfig = PROVIDER_CONFIGS[selectedProvider];

    // Step 2: Get API Key (if required)
    let apiKey = '';
    if (providerConfig.requiresApiKey) {
      const keyAnswer = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: `Enter your ${providerConfig.displayName} API key:`,
          mask: '*',
          validate: (input: string) => {
            if (!input.trim()) {
              return 'API key is required';
            }
            return true;
          }
        },
        {
          type: 'confirm',
          name: 'continue',
          message: 'Continue with configuration?',
          default: true
        }
      ]);

      if (!keyAnswer.continue) {
        console.log(chalk.yellow('Configuration cancelled.'));
        return;
      }

      apiKey = keyAnswer.apiKey;
    }

    // Step 3: Get available models and let user select
    console.log(chalk.blue('\nFetching available models...'));
    
    try {
      const models = await getAvailableModels(selectedProvider, apiKey);

      if (models.length === 0) {
        console.log(chalk.red('No models available for this provider.'));
        return;
      }

      const modelAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'model',
          message: 'Select a model:',
          choices: [
            ...models.map(model => ({ name: model, value: model })),
            { name: 'Exit', value: 'exit' }
          ]
        }
      ]);

      if (modelAnswer.model === 'exit') {
        console.log(chalk.yellow('Configuration cancelled.'));
        return;
      }

      // Save configuration
      const config: Config = {
        provider: selectedProvider,
        apiKey,
        model: modelAnswer.model
      };

      await saveConfig(config);
      console.log(chalk.green('✅ Configuration saved successfully!'));
      console.log(chalk.blue(`Provider: ${providerConfig.displayName}`));
      console.log(chalk.blue(`Model: ${modelAnswer.model}`));
      
    } catch (error) {
      console.error(chalk.red('Failed to fetch models:'), error);
      console.log(chalk.yellow('Please check your API key and try again.'));
    }

  } catch (error) {
    if (error && typeof error === 'object' && 'isTtyError' in error) {
      console.error(chalk.red('Configuration cancelled by user.'));
    } else {
      console.error(chalk.red('Configuration failed:'), error);
    }
  }
}