import * as dotenv from 'dotenv';
import * as path from 'pathe';
import { prompts } from '../src/prompt.js';

dotenv.config({ path: path.join(process.cwd(), '.env') });

interface CommitMsg {
  subject: string;
  body: string;
  breaking: boolean;
  score?: number;
  reason?: string;
}

async function generateSimple(diff: string, model: string, promptVer: 'prompt_A' | 'prompt_B' | 'prompt_C'): Promise<CommitMsg> {
  const prompt = prompts[promptVer].replace('{{diff}}', diff);

  const response = await fetch(`${process.env.OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API 请求失败: ${response.status} - ${text}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  console.log('完整响应:', text);
  console.log('响应长度:', text.length);

  let jsonText = text;
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  const parsed = JSON.parse(jsonText);
  return {
    subject: parsed.subject || '',
    body: parsed.body || '',
    breaking: parsed.breaking || false,
    score: parsed.score || 0,
    reason: parsed.reason || '',
  };
}

async function testSingleDiff() {
  const diff = `diff --git a/src/index.ts b/src/index.ts
index 1234567..abcdefg 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
 import { program } from 'commander';
+import { generate } from './generate.js';`;

  console.log('测试简单的 diff...');
  console.log('Diff:', diff.substring(0, 100) + '...');

  for (const promptVer of ['prompt_A', 'prompt_B', 'prompt_C']) {
    console.log(`\n=== 测试 ${promptVer} ===`);

    try {
      const result = await generateSimple(diff, process.env.MODEL_NAME || 'glm-4.6', promptVer as any);
      console.log('✅ 成功');
      console.log('Subject:', result.subject);
      console.log('Score:', result.score);
      console.log('Reason:', result.reason);
    } catch (error) {
      console.error('❌ 失败');
      console.error('错误:', error instanceof Error ? error.message : String(error));
    }
  }
}

testSingleDiff();
