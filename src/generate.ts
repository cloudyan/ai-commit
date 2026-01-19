// 旧写法（ai-sdk v3 及更早）
// import { openai } from '@ai-sdk/openai';

// 新写法（ai-sdk v4+ 推荐）
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import { prompts } from './prompt.js';
import { containsSensitiveInfo, formatCommitMessage, withRetry } from './utils.js';
import { loadConfig, config } from './config.js';

loadConfig();

interface CommitMsg {
  subject: string;
  body: string;
  breaking: boolean;
  score?: number;
  reason?: string;
}

const openai = createOpenAICompatible({
  name: 'iflow',
  apiKey: config.openaiApiKey(),
  baseURL: config.openaiBaseUrl(),
  headers: {
    'Authorization': `Bearer ${config.openaiApiKey()}`,
  },
});

export async function generate(
  diff: string,
  model = config.modelName(),
  promptVer: 'prompt_A' | 'prompt_B' | 'prompt_C' = config.promptVersion() as any
): Promise<CommitMsg> {
  // 验证prompt版本
  if (!prompts[promptVer]) {
    throw new Error(`不支持的prompt版本: ${promptVer}，支持的版本: prompt_A, prompt_B, prompt_C`);
  }

  const prompt = prompts[promptVer].replace('{{diff}}', diff);

  try {
    const { text } = await generateText({
      model: openai(model), // 可换成 claude/deepseek
      prompt,
      maxOutputTokens: 5000,
      temperature: 0.3,
    });

    // 清理和验证AI响应
    const cleanedText = text.trim();
    if (!cleanedText) {
      throw new Error('AI模型返回空响应');
    }

    // 尝试解析JSON，提供详细的错误信息
    let parsed: CommitMsg;
    try {
      // 尝试提取 JSON（处理可能包含代码块标记的情况）
      let jsonText = cleanedText;
      const codeBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      }

      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('AI响应内容:', cleanedText);
      throw new Error(`AI响应格式错误: ${parseError instanceof Error ? parseError.message : '无效的JSON格式'}`);
    }

    // 验证必需字段
    if (!parsed.subject) {
      throw new Error('AI响应缺少必需的subject字段');
    }

    // 检查敏感信息
    const sensitiveCheck = containsSensitiveInfo(parsed.subject + parsed.body);
    if (sensitiveCheck.hasSecrets) {
      throw new Error(`检测到敏感信息: ${sensitiveCheck.issues.join(', ')}`);
    }

    // 格式化提交信息
    const formatted = formatCommitMessage(parsed.subject, parsed.body);

    // 确保有合理的默认值
    return {
      subject: formatted.formattedSubject,
      body: formatted.formattedBody,
      breaking: parsed.breaking || false,
      score: parsed.score || 0,
      reason: parsed.reason || ''
    };

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`生成提交信息失败: ${error.message}`);
    }
    throw new Error('生成提交信息时发生未知错误');
  }
}
