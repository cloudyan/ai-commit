import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';
import * as path from 'pathe';

dotenv.config({ path: path.join(process.cwd(), '.env') });

console.log('测试 ai-sdk 的 headers...');

// 测试1: 带 headers
const providerWithHeaders = createOpenAICompatible({
  name: 'iflow',
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || '',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`,
  },
});

console.log('\n测试1: 带 headers');
try {
  const result = await generateText({
    model: providerWithHeaders('glm-4.6'),
    prompt: '说"成功"',
    maxOutputTokens: 20,
  });
  console.log('✅ 成功');
  console.log('响应:', result.text.substring(0, 100));
} catch (error) {
  console.error('❌ 失败');
  console.error('错误:', error instanceof Error ? error.message : String(error));
}

// 测试2: 不带 headers
const providerWithoutHeaders = createOpenAICompatible({
  name: 'iflow',
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || '',
});

console.log('\n测试2: 不带 headers');
try {
  const result = await generateText({
    model: providerWithoutHeaders('glm-4.6'),
    prompt: '说"成功"',
    maxOutputTokens: 20,
  });
  console.log('✅ 成功');
  console.log('响应:', result.text.substring(0, 100));
} catch (error) {
  console.error('❌ 失败');
  console.error('错误:', error instanceof Error ? error.message : String(error));
}
