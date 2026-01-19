import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { prompts } from './prompt.js';

interface CommitMsg {
  subject: string;
  body: string;
  breaking: boolean;
  score?: number;
  reason?: string;
}

export async function generate(
  diff: string,
  model = 'gpt-3.5-turbo',
  promptVer: 'A' | 'B' = 'A'
): Promise<CommitMsg> {
  const prompt = prompts[promptVer].replace('{{diff}}', diff);
  const { text } = await generateText({
    model: openai(model), // 可换成 claude/deepseek
    prompt,
    maxTokens: 300,
    temperature: 0.3,
  });
  return JSON.parse(text);
}
