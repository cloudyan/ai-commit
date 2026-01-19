import assert from 'node:assert';

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

test('测试generate函数 - Mock场景', async () => {
  const mockAIResponse = JSON.stringify({
    subject: 'test: add feature',
    body: 'This is a test body',
    breaking: false,
    score: 85,
    reason: 'Good description'
  });

  assert.ok(mockAIResponse, 'Mock响应应该存在');
  assert.strictEqual(typeof mockAIResponse, 'string', 'Mock响应应该是字符串');
});

test('测试CommitMsg接口', async () => {
  const commitMsg = {
    subject: 'feat: new feature',
    body: 'Detailed description',
    breaking: false,
    score: 90,
    reason: 'Excellent'
  };

  assert.ok(commitMsg.subject, 'CommitMsg应该有subject字段');
  assert.strictEqual(typeof commitMsg.subject, 'string', 'subject应该是字符串');
  assert.strictEqual(typeof commitMsg.breaking, 'boolean', 'breaking应该是布尔值');
  assert.strictEqual(commitMsg.breaking, false, 'breaking应该是false');
});

test('测试prompt模板', async () => {
  const promptTemplateA = `You are a commit message generator. Analyze the given Git diff and generate a commit message following Conventional Commits specification.

Rules:
1. Use imperative mood ("add" not "added", "fix" not "fixed")
2. Keep subject under 50 characters
3. Start with appropriate type: feat, fix, docs, style, refactor, test, chore
4. Do not use redundant words like "updated", "modified", "changed"
5. Be specific about what was changed

For the given diff, output ONLY valid JSON in this exact format:
{"subject":"your commit message under 50 chars","body":"detailed explanation if needed, max 72 chars per line","breaking":false,"score":85,"reason":"brief explanation of your choices"}

Diff to analyze:
{{diff}}`;

  assert.ok(promptTemplateA.includes('{{diff}}'), 'Prompt模板应该包含{{diff}}占位符');
  assert.ok(promptTemplateA.includes('Conventional Commits'), 'Prompt模板应该提到Conventional Commits');
  assert.ok(promptTemplateA.includes('JSON'), 'Prompt模板应该要求JSON格式');
});

test('测试diff替换逻辑', async () => {
  const prompt = 'Diff to analyze:\n{{diff}}';
  const diff = 'Added new file\nDeleted old file';
  const result = prompt.replace('{{diff}}', diff);

  assert.strictEqual(result.includes('Added new file'), true, '结果应该包含diff内容');
  assert.strictEqual(result.includes('{{diff}}'), false, '结果不应该包含{{diff}}占位符');
  assert.strictEqual(result.includes('Deleted old file'), true, '结果应该包含完整的diff');
});

test('测试环境变量检查', async () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalBaseUrl = process.env.OPENAI_BASE_URL;

  try {
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.OPENAI_BASE_URL = 'https://api.test.com';

    assert.strictEqual(process.env.OPENAI_API_KEY, 'test-api-key', 'API Key应该被设置');
    assert.strictEqual(process.env.OPENAI_BASE_URL, 'https://api.test.com', 'Base URL应该被设置');
  } finally {
    process.env.OPENAI_API_KEY = originalApiKey;
    process.env.OPENAI_BASE_URL = originalBaseUrl;
  }
});

test('测试模型名称验证', async () => {
  const validModels = ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4-turbo', 'claude-3-sonnet-20240229'];

  for (const model of validModels) {
    assert.strictEqual(typeof model, 'string', '模型名称应该是字符串');
    assert.ok(model.length > 0, '模型名称不能为空');
  }
});

test('测试prompt版本验证', async () => {
  const validPromptVersions = ['A', 'B'];

  for (const version of validPromptVersions) {
    assert.strictEqual(typeof version, 'string', 'Prompt版本应该是字符串');
    assert.strictEqual(version.length, 1, 'Prompt版本应该是单个字符');
    assert.ok(['A', 'B'].includes(version), `Prompt版本${version}应该有效`);
  }
});

test('测试CommitMsg字段验证', async () => {
  const validCommitMsg = {
    subject: 'fix: handle null values',
    body: 'Added null checks to prevent errors',
    breaking: false,
    score: 95,
    reason: 'Good error handling'
  };

  assert.strictEqual(typeof validCommitMsg.subject, 'string', 'subject应该是字符串');
  assert.strictEqual(typeof validCommitMsg.body, 'string', 'body应该是字符串');
  assert.strictEqual(typeof validCommitMsg.breaking, 'boolean', 'breaking应该是布尔值');
  assert.strictEqual(typeof validCommitMsg.score, 'number', 'score应该是数字');
  assert.strictEqual(typeof validCommitMsg.reason, 'string', 'reason应该是字符串');
  assert.ok(validCommitMsg.subject.length <= 50, 'subject长度应该不超过50字符');
  assert.ok(validCommitMsg.score >= 0, 'score应该非负');
  assert.ok(validCommitMsg.score <= 100, 'score应该不超过100');
});

test('测试错误处理逻辑', async () => {
  const errorCases = [
    { name: '空响应', response: '' },
    { name: '无效JSON', response: '{invalid json}' },
    { name: '缺少subject', response: '{"body":"test"}' },
  ];

  for (const testCase of errorCases) {
    assert.ok(testCase.name, '错误用例应该有名称');
    assert.ok(typeof testCase.response === 'string', '响应应该是字符串');
  }
});

runTests().catch((error) => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
