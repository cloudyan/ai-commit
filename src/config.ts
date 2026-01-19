import * as dotenv from 'dotenv';
import * as path from 'pathe';

export function loadConfig() {
  try {
    dotenv.config({ path: path.join(process.cwd(), '.env') });
  } catch (error) {
    // .env 文件不存在时继续执行，使用系统环境变量
  }
}

export function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`环境变量 ${key} 未设置，请在 .env 文件中配置`);
  }
  return value;
}

export const config = {
  openaiApiKey: () => requireEnv('OPENAI_API_KEY'),
  openaiBaseUrl: () => getEnv('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
  modelName: () => getEnv('MODEL_NAME', 'gpt-3.5-turbo'),
  promptVersion: () => getEnv('PROMPT_VERSION', 'prompt_A'),
};
