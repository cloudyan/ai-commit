import { loadConfig, config } from '../src/config.js';

loadConfig();

console.log('=== 配置检查 ===');
console.log('OPENAI_API_KEY:', config.openaiApiKey() ? '已配置' : '未配置');
console.log('OPENAI_BASE_URL:', config.openaiBaseUrl());
console.log('MODEL_NAME:', config.modelName());
console.log('PROMPT_VERSION:', config.promptVersion());
console.log('\nprocess.env.OPENAI_API_KEY:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');
