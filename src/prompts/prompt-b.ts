export const commitPrompt =
`为以下 diff 生成简洁的提交信息，遵循 Conventional Commits 规范。

要求:
- 使用祈使语气
- 保持在 50 个字符以内
- 以正确的类型开头（feat/fix/docs/style/refactor/test/chore）
- 具体明确
- 如果需要，添加详细说明（每行 72 字符自动换行）

输出 JSON 格式:
{"subject":"提交信息","body":"详细说明","breaking":boolean}

Git diff:
{{diff}}`;
