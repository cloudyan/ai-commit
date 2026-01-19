# ai-commit 设计文档（中文版）

> 对应代码仓库：`ai-commit`
> 版本：v1.0.0

---

## 1. 目标与定位

**目标**：让每一次 `git commit` 都能「零思考」生成符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范、风格统一、语义准确、不泄露敏感信息的提交消息。
**定位**：开发体验（DX）工具——**本地 CLI + 可插拔模型 + 可量化评估**，不做重 SaaS，不做 Git Hook 强入侵。

---

## 2. 场景用例

| 角色 | 场景 | 期望 |
| ---- | ---- | ---- |
| 个人开发者 | `git add .` ➜ 手敲 message 痛苦 | 一条命令生成并直接 commit |
| 团队 Tech Lead | 多人风格混乱、CI 脚本解析失败 | 通过评估流水线锁定最佳 prompt/模型，全员统一 |
| 开源维护者 | PR 中 commit message 质量参差 | 在 CI 中跑 `npm run eval` 贴出 Badge，低分拒绝合并 |

---

## 3. 高层架构

```
┌-------------┐     ┌--------------┐     ┌---------------┐
│   CLI       │----►│  Generate    │----►│ Model Adapter │
│(src/index)  │     │(src/generate)│     │(ai-sdk compat)│
└-------------┘     └--------------┘     └---------------┘
        ▲                    ▲                    ▲
        │                    │                    │
        └-------------┐      │         ┌----------┘
                      │      │         │
                  ┌--------------┐     │
                  │  Evaluate    │-----┘
                  │(src/evaluate)│
                  └--------------┘
```

- **CLI**：负责读取 `git diff --cached`，调用 Generate，回写终端
- **Generate**：组装 prompt，调用 `ai-sdk` 的 `generateText`，返回结构化 JSON
- **Model Adapter**：基于 `createOpenAICompatible`，支持 OpenAI/Claude/DeepSeek/One-API 零成本切换
- **Evaluate**：独立脚本，Fan-Out 并发调模型，按「Style + Semantic + Safety」三维度量化打分，输出 CSV + Badge

---

## 4. 核心流程

### 4.1 生成流程（Happy Path）

1. 用户执行 `npm run dev`
2. CLI 调用 `execSync('git diff --cached')` 取得 diff 文本
3. 把 diff 注入 prompt 模板（A/B 可选）→ 调 `generateText`
4. 解析返回 JSON，回显到终端
5. 用户可重定向提交：
   `npm run dev | git commit -F -`

### 4.2 评估流程（Fan-Out / Fan-In）

1. 加载 `dataset.jsonl`（50~500 条）
2. 对每一条并发调用 `generate()`，记录 `{subject, body, breaking, score}`
3. 硬指标检查（type/长度/命令式/密钥正则）→ Style & Safety
4. Embedding 余弦相似度 vs ground_truth → Semantic
5. 聚合指标，输出表格 + JSON Badge
6. A/B 对比：双循环跑完自动选出「(model, promptVer)」最优组合

---

## 5. 关键设计决策

| 决策 | 选型 | 理由 |
| ---- | ---- | ---- |
| 模型接口 | `ai-sdk` + `createOpenAICompatible` | 官方推荐，v4 后新特性优先在此包迭代 |
| 并发评估 | Promise.all + Map 重排 | 10 并发内 3 s 跑完 50 条，结果按调用顺序归位，避免上下文错乱 |
| 评分维度 | Style 40% / Semantic 30% / Concise 20% / Safety 10% | 可全自动计算，无需人工标注 |
| 流式输出 | 仅子任务内部用 `streamText`，Fan-In 前拼成完整字符串 | 主模型上下文保持非流式，简化后续消息组装 |
| 安全策略 | 正则 `sk-\w{20,}` + 邮箱 + 内网 IP | 失败即整项 Safety=0，并打印警告 |
| 数据集规模 | 50 条即可门禁，500 条进入「置信区间」 | 兼顾成本与统计意义（$0.30/50 条） |

---

## 6. 扩展点

1. **多语言支持**
   在 `prompt.ts` 新增 `zh-CN` / `en-US` 模板，根据 `git config i18n.commitEncoding` 自动切换。

2. **IDE 插件**
   暴露 LSP 命令 `commitMsg.generate`，复用同一 `generate()` 函数。

3. **更大模型 & 长 diff**
   当 diff > 50 k tok 时，先走 `wU2Compressor` 保留关键行，或改用 `claude-3-100k` 模型。

4. **强化学习微调**
   把评估流水线产出的「高分样本」回流成 JSONL，调用 OpenAI Fine-Tuning API，训练专属小模型，成本 ↓ 70%。

---

## 7.  Roadmap

| 版本 | 功能 |
| ---- | ---- |
| v1.1 | 支持 `-- Amend` 模式，为上一次提交重写 message |
| v1.3 | 推出 VSCode 插件市场版 |


---

## 8.  参考 & 致谢

- [Conventional Commits](https://www.conventionalcommits.org/)
- [ai-sdk official](https://sdk.vercel.ai/)
- Claude Code 并发子任务设计思路
- Gitmoji & Angular Commit Guidelines
