import assert from 'node:assert';
import {
  containsSensitiveInfo,
  formatCommitMessage,
  delay,
  withRetry,
} from '../src/utils.js';

const tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];

function test(name: string, fn: () => Promise<void> | void) {
  tests.push({ name, fn });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✓ ${t.name}`);
      passed++;
    } catch (error) {
      console.error(`✗ ${t.name}`);
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }

  console.log(`\n总计: ${tests.length} 个测试, ${passed} 通过, ${failed} 失败`);
  if (failed > 0) {
    process.exit(1);
  }
}

test('检测API密钥', () => {
  const result = containsSensitiveInfo('const API_KEY=sk-1234567890abcdef123456');
  assert.strictEqual(result.hasSecrets, true);
  assert.ok(result.issues.includes('可能的API密钥'));
});

test('检测邮箱地址', () => {
  const result = containsSensitiveInfo('contact user@example.com');
  assert.strictEqual(result.hasSecrets, true);
  assert.ok(result.issues.includes('邮箱地址'));
});

test('检测内网IP', () => {
  const result = containsSensitiveInfo('Server: 192.168.1.1');
  assert.strictEqual(result.hasSecrets, true);
  assert.ok(result.issues.includes('内网IP地址'));
});

test('检测密码模式', () => {
  const result = containsSensitiveInfo('password: secret123');
  assert.strictEqual(result.hasSecrets, true);
  assert.ok(result.issues.includes('可能的密码'));
});

test('安全的文本', () => {
  const result = containsSensitiveInfo('This is safe content');
  assert.strictEqual(result.hasSecrets, false);
  assert.strictEqual(result.issues.length, 0);
});

test('检测多种敏感信息', () => {
  const text = 'API key sk-1234567890abcdef123456 and email test@test.com and IP 10.0.0.1 password: secret';
  const result = containsSensitiveInfo(text);
  assert.strictEqual(result.hasSecrets, true);
  assert.ok(result.issues.includes('可能的API密钥'));
  assert.ok(result.issues.includes('邮箱地址'));
  assert.ok(result.issues.includes('内网IP地址'));
  assert.ok(result.issues.includes('可能的密码'));
});

test('格式化简单主题', () => {
  const result = formatCommitMessage('Add new feature');
  assert.strictEqual(result.formattedSubject, 'Add new feature');
  assert.strictEqual(result.formattedBody, '');
});

test('格式化带正文的提交信息', () => {
  const result = formatCommitMessage(
    'Add new feature',
    'This adds a new feature that allows users to do something useful.'
  );
  assert.strictEqual(result.formattedSubject, 'Add new feature');
  assert.strictEqual(
    result.formattedBody,
    'This adds a new feature that allows users to do something useful.'
  );
});

test('移除结尾标点符号', () => {
  const result = formatCommitMessage('Fix bug.');
  assert.strictEqual(result.formattedSubject, 'Fix bug');
});

test('限制主题长度', () => {
  const longSubject = 'This is a very long subject that exceeds 50 characters limit';
  const result = formatCommitMessage(longSubject);
  assert.strictEqual(
    result.formattedSubject,
    'This is a very long subject that exceeds 50 cha...'
  );
  assert.ok(result.formattedSubject.length <= 50);
});

test('格式化过长的正文行', () => {
  const longBody =
    'This is a very long body line that definitely exceeds 72 characters limit and should be wrapped to multiple lines automatically';
  const result = formatCommitMessage('Short', longBody);
  assert.ok(
    result.formattedBody.split('\n').every((line) => line.length <= 72)
  );
});

test('清理空格', () => {
  const result = formatCommitMessage('  Add feature  ', '  Description  ');
  assert.strictEqual(result.formattedSubject, 'Add feature');
  assert.strictEqual(result.formattedBody, 'Description');
});

test('延迟指定时间', async () => {
  const start = Date.now();
  await delay(100);
  const end = Date.now();
  const elapsed = end - start;
  assert.ok(elapsed >= 90, `延迟时间过短: ${elapsed}ms`);
  assert.ok(elapsed < 200, `延迟时间过长: ${elapsed}ms`);
});

test('成功时不重试', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    return 'success';
  };
  const result = await withRetry(fn, 3, 10);
  assert.strictEqual(result, 'success');
  assert.strictEqual(attempts, 1);
});

test('失败时重试', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 2) {
      throw new Error('failed');
    }
    return 'success after retry';
  };
  const result = await withRetry(fn, 3, 10);
  assert.strictEqual(result, 'success after retry');
  assert.strictEqual(attempts, 2);
});

test('超过重试次数时抛出错误', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    throw new Error('always fails');
  };
  try {
    await withRetry(fn, 3, 10);
    assert.fail('应该抛出错误');
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.strictEqual(error.message, 'always fails');
    assert.strictEqual(attempts, 3);
  }
});

test('指数退避', async () => {
  let attempts = 0;
  const timestamps: number[] = [];
  const fn = async () => {
    timestamps.push(Date.now());
    attempts++;
    if (attempts < 3) {
      throw new Error('failed');
    }
    return 'success';
  };
  await withRetry(fn, 3, 50);
  assert.strictEqual(timestamps.length, 3);
  const delay1 = timestamps[1] - timestamps[0];
  const delay2 = timestamps[2] - timestamps[1];
  assert.ok(delay2 > delay1, `延迟应该增加: ${delay1}ms -> ${delay2}ms`);
});

runTests().catch((error) => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
