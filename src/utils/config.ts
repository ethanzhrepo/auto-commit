import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';
import { Config } from '../types';

const CONFIG_DIR = path.join(os.homedir(), '.auto-commit');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.yml');

export async function ensureConfigDir(): Promise<void> {
  await fs.ensureDir(CONFIG_DIR);
}

export async function saveConfig(config: Config): Promise<void> {
  await ensureConfigDir();
  const yamlStr = yaml.dump(config);
  await fs.writeFile(CONFIG_FILE, yamlStr, 'utf8');
}

export async function loadConfig(): Promise<Config | null> {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const content = await fs.readFile(CONFIG_FILE, 'utf8');
      return yaml.load(content) as Config;
    }
    return null;
  } catch (error) {
    console.error('Failed to load config:', error);
    return null;
  }
}

export async function configExists(): Promise<boolean> {
  return fs.pathExists(CONFIG_FILE);
}