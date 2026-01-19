import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';
import * as path from 'pathe';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// 方案1: 直接配置
console.log('方案1: 基础配置');
console.log('API_KEY:', process.env.OPENAI_API_KEY ? '已配置' : '未配置');
console.log('Base URL:', process.env.OPENAI_BASE_URL);
console.log('Model:', process.env.MODEL_NAME);
console.log('');

// 方案2: 尝试不同的请求头配置
const openaiV1 = createOpenAICompatible({
  name: 'iflow',
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || '',
});

const openaiV2 = createOpenAICompatible({
  name: 'iflow-custom',
  apiKey: `Bearer ${process.env.OPENAI_API_KEY || ''}`,
  baseURL: process.env.OPENAI_BASE_URL || '',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`,
  },
});

// 方案3: 使用标准 OpenAI 兼容模式
const openaiV3 = createOpenAICompatible({
  name: 'iflow-standard',
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
});

async function testProvider(name: string, provider: any, model: string) {
  console.log(`\n=== 测试 ${name} ===`);

  try {
    const { text, usage } = await generateText({
      model: provider(model),
      prompt: 'Hello, say "test successful" in JSON format: {"status":"ok"}',
      maxOutputTokens: 50,
      temperature: 0,
    });

    console.log('✅ 成功');
    console.log('响应:', text);
    console.log('Usage:', usage);
    return true;
  } catch (error) {
    console.error('❌ 失败');
    console.error('错误:', error instanceof Error ? error.message : String(error));

    // 打印更详细的错误信息
    if (error && typeof error === 'object') {
      if ('cause' in error) {
        console.error('Cause:', error.cause);
      }
      if ('responseBody' in error) {
        console.error('Response:', (error as any).responseBody);
      }
    }

    return false;
  }
}

async function main() {
  const model = process.env.MODEL_NAME || 'gpt-3.5-turbo';

  // 测试所有方案
  await testProvider('方案1: 基础配置', openaiV1, model);
  await testProvider('方案2: 自定义请求头', openaiV2, model);
  await testProvider('方案3: 标准 OpenAI', openaiV3, model);

  console.log('\n\n=== 建议的修复方案 ===');
  console.log('如果以上都失败，可能需要：');
  console.log('1. 更换 API 提供商（DeepSeek, 官方 OpenAI）');
  console.log('2. 检查 iFlow API 文档确认正确的认证方式');
  console.log('3. 确认 API key 是否有效且未过期');
}

main();
