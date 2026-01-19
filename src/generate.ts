// 旧写法（ai-sdk v3 及更早）
// import { openai } from '@ai-sdk/openai';

// 新写法（ai-sdk v4+ 推荐）
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import { prompts } from './prompt.js';

interface CommitMsg {
  subject: string;
  body: string;
  breaking: boolean;
  score?: number;
  reason?: string;
}

/**
 * 创建 OpenAI 兼容实例
 *  - 官方 OpenAI 直接用 https://api.openai.com/v1
 *  - 想切 Claude / DeepSeek / One-API 只改 baseURL 即可
 */
const openai = createOpenAICompatible({
  name: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1', // 可选，默认就是它
});

export async function generate(
  diff: string,
  model = 'gpt-3.5-turbo',
  promptVer: 'A' | 'B' = 'A'
): Promise<CommitMsg> {
  const prompt = prompts[promptVer].replace('{{diff}}', diff);
  const { text } = await generateText({
    model: openai(model), // 可换成 claude/deepseek
    prompt,
    maxOutputTokens: 300,
    temperature: 0.3,
  });
  return JSON.parse(text);
}
