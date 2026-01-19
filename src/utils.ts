import * as fs from 'fs';
import * as path from 'path';

/**
 * 安全地写入文件，确保目录存在
 */
export function safeWriteFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * 检查字符串是否包含敏感信息
 */
export function containsSensitiveInfo(text: string): {
  hasSecrets: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // 检查API密钥
  if (/sk-[a-zA-Z0-9]{20,}/.test(text)) {
    issues.push('可能的API密钥');
  }

  // 检查邮箱地址
  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
    issues.push('邮箱地址');
  }

  // 检查内网IP
  if (/\b(?:10|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/.test(text)) {
    issues.push('内网IP地址');
  }

  // 检查密码模式
  if (/password\s*[:=]\s*['"]?[^\s'"]+/.test(text.toLowerCase())) {
    issues.push('可能的密码');
  }

  return {
    hasSecrets: issues.length > 0,
    issues
  };
}

/**
 * 格式化提交信息，确保符合规范
 */
export function formatCommitMessage(subject: string, body: string = ''): {
  formattedSubject: string;
  formattedBody: string;
} {
  // 清理主题行
  let formattedSubject = subject.trim();

  // 确保首字母小写（除了专有名词）
  if (formattedSubject.length > 0 && !/^\p{Lu}/u.test(formattedSubject[0])) {
    formattedSubject = formattedSubject[0].toLowerCase() + formattedSubject.slice(1);
  }

  // 移除结尾的标点符号
  formattedSubject = formattedSubject.replace(/[.!;:]$/, '');

  // 限制长度
  if (formattedSubject.length > 50) {
    formattedSubject = formattedSubject.substring(0, 47) + '...';
  }

  // 格式化正文
  let formattedBody = body.trim();
  if (formattedBody) {
    // 确保每行不超过72字符
    const lines = formattedBody.split('\n');
    const wrappedLines: string[] = [];

    for (const line of lines) {
      if (line.length <= 72) {
        wrappedLines.push(line);
      } else {
        // 简单的单词换行
        const words = line.split(' ');
        let currentLine = '';

        for (const word of words) {
          const space = currentLine ? ' ' : '';
          if ((currentLine + space + word).length <= 72) {
            currentLine += space + word;
          } else {
            if (currentLine) {
              wrappedLines.push(currentLine);
            }
            currentLine = word;
          }
        }

        if (currentLine) {
          wrappedLines.push(currentLine);
        }
      }
    }

    formattedBody = wrappedLines.join('\n');
  }

  return {
    formattedSubject,
    formattedBody
  };
}

/**
 * 延迟执行工具函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试机制
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries) {
        throw lastError;
      }

      console.log(`尝试 ${attempt} 失败，${delayMs}ms后重试...`);
      await delay(delayMs);
      delayMs *= 2; // 指数退避
    }
  }

  throw lastError!;
}

/**
 * 检测语言是否为英语
 */
export function isEnglish(language: string): boolean {
  const normalizedLang = language.toLowerCase().trim();
  return normalizedLang === 'en' || normalizedLang === 'english' || normalizedLang === 'eng';
}

/**
 * 获取默认语言（基于系统 locale）
 */
export function getDefaultLanguage(): string {
  const locale = process.env.LANG || process.env.LC_ALL || process.env.LC_CTYPE || 'zh_CN.UTF-8';
  return locale.startsWith('en') ? 'en' : 'zh';
}
