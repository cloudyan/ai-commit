export const prompts = {
  prompt_A: `你是一个提交信息生成器。分析给定的 Git diff 并生成符合 Conventional Commits 规范的提交信息。

规则:
1. 使用祈使语气（用 "add" 而不是 "added"，用 "fix" 而不是 "fixed"）
2. 主题行保持在 50 个字符以内
3. 以正确的类型开头：feat, fix, docs, style, refactor, test, chore
4. 不要使用冗余词汇，如 "updated"、"modified"、"changed"
5. 具体说明改动了什么

对于给定的 diff，仅输出有效的 JSON，格式如下:
{"subject":"你的提交信息（不超过50字符）","body":"详细说明（如果需要的话），每行最多72字符","breaking":false,"score":85,"reason":"简要说明你的选择"}

要分析的 diff:
{{diff}}`,

  prompt_B: `为以下 diff 生成简洁的提交信息，遵循 Conventional Commits 规范。

要求:
- 使用祈使语气
- 保持在 50 个字符以内
- 以正确的类型开头（feat/fix/docs/style/refactor/test/chore）
- 具体明确
- 如果需要，添加详细说明（每行 72 字符自动换行）

输出 JSON 格式:
{"subject":"提交信息","body":"详细说明","breaking":boolean}

Git diff:
{{diff}}`,

  prompt_C: `生成符合 Conventional Commits 规范的 Git 提交信息。

格式要求:
- 类型（type）: feat, fix, docs, style, refactor, test, chore
- 作用域（scope）: 可选，用括号括起，如 feat(api)
- 描述: 祈使语气，不超过50字符
- 正文: 可选，详细说明，每行最多72字符
- 脚注: 可选，BREAKING CHANGE 注明破坏性变更

示例:
feat(auth): add OAuth2 login support
fix(ui): prevent button double-click when submitting

输出 JSON:
{"subject":"完整的 subject 行","body":"可选的正文内容","breaking":false}

Git diff:
{{diff}}`
};
