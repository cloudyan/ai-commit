export const commitPrompt =
`生成符合 Conventional Commits 规范的 Git 提交信息。

格式要求:
- 类型（type）: feat, fix, docs, style, refactor, test, chore
- 作用域（scope）: 可选，用括号括起，如 feat(api)
- 描述: 祈使语气，不超过50字符
- 正文: 可选，详细说明，每行最多72字符
- 脚注: 可选，BREAKING CHANGE 注明破坏性变更
- 使用 {{language}} 作为输出语言

示例:
feat(auth): add OAuth2 login support
fix(ui): prevent button double-click when submitting

输出 JSON:
{"subject":"完整的 subject 行","body":"可选的正文内容","breaking":false}

Git diff:
{{diff}}`;
