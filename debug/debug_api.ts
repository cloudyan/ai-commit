import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';
import * as path from 'pathe';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const openai = createOpenAICompatible({
  name: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

async function test() {
  const prompt = `你是一个提交信息生成器。分析给定的 Git diff 并生成符合 Conventional Commits 规范的提交信息。

规则:
1. 使用祈使语气（用 "add" 而不是 "added"，用 "fix" 而不是 "fixed"）
2. 主题行保持在 50 个字符以内
3. 以正确的类型开头：feat, fix, docs, style, refactor, test, chore
4. 不要使用冗余词汇，如 "updated"、"modified"、"changed"
5. 具体说明改动了什么

对于给定的 diff，仅输出有效的 JSON，格式如下:
{"subject":"你的提交信息（不超过50字符）","body":"详细说明（如果需要的话），每行最多72字符","breaking":false,"score":85,"reason":"简要说明你的选择"}

要分析的 diff:
feat: add user authentication`;

  try {
    console.log('调用模型:', process.env.MODEL_NAME);
    console.log('Base URL:', process.env.OPENAI_BASE_URL);

    const { text, usage } = await generateText({
      model: openai(process.env.MODEL_NAME || 'gpt-3.5-turbo'),
      prompt,
      maxOutputTokens: 500,
      temperature: 0.3,
    });

    console.log('\n=== 完整响应 ===');
    console.log(text);
    console.log('\n=== Token 使用 ===');
    console.log(usage);

    console.log('\n=== 尝试解析 JSON ===');
    try {
      const parsed = JSON.parse(text);
      console.log('JSON 解析成功:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error('JSON 解析失败:', e);
    }

  } catch (error) {
    console.error('错误:', error);
    if (error instanceof Error) {
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
    }
  }
}

test();
