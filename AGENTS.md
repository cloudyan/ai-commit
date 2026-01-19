# AGENTS.md

此文件为在这个代码库中工作的 AI 代理（Agent）提供指导。

---

## 构建与运行命令

```bash
# 开发运行（生成提交信息）
npm run dev
# 指定模型和 prompt 版本
npm run dev -- --model gpt-4o --prompt B

# 评估单个组合
npm run eval

# A/B 对比（自动选择最优组合）
npm run eval:compare
```

**注意**：此项目不使用传统的单元测试框架（如 Jest/Vitest），而是通过评估脚本（`src/evaluate/run.ts`）进行端到端的模型输出质量验证。

---

## 代码风格指南

### 导入规范

```typescript
// 第三方库优先，本地模块用相对路径（必须带 .js 扩展名）
import { program } from 'commander';
import { generate } from './generate.js';
```

### 格式化规范

- 缩进：2 个空格
- 使用 ESLint（默认 TypeScript 规范），未配置 Prettier

### 类型定义

```typescript
interface CommitMsg {
  subject: string;
  body: string;
  breaking: boolean;
  score?: number;  // 可选属性
}
// 联合类型：'A' | 'B' = 'A'
// 非空断言：process.env.OPENAI_API_KEY!
```

### 命名约定

- 变量/函数/常量：camelCase
- 类型/接口：PascalCase
- 文件名：kebab-case
- CLI 选项：kebab-case

### 错误处理

```typescript
if (!diff) return console.log('No staged changes.');
// 使用 Promise reject 处理异步错误，避免空 catch 块
```

### 异步代码

```typescript
// 优先 async/await
export async function generate(diff: string, model = 'gpt-3.5-turbo'): Promise<CommitMsg>
// 文件流操作使用 Promise 包装
```

### 注释与安全

```typescript
/** JSDoc 风格注释，使用中文 */
// 安全检查：const safe = !/sk-\w{20,}/i.test(text);
```

---

## 项目架构

```
src/
├── index.ts          # CLI 入口，使用 commander 解析参数
├── generate.ts       # 核心生成逻辑，基于 ai-sdk 调用模型
├── prompt.ts         # Prompt 模板管理（支持 A/B 版本）
└── evaluate/
    └── run.ts        # 评估脚本，按 Style/Semantic/Safety 三维度打分
```

### 核心模块职责

- **CLI**：执行 `git diff --cached`，调用 `generate()` 并输出结果
- **Generate**：组装 prompt，调用模型，解析 JSON 返回 `CommitMsg` 对象
- **Prompt**：管理不同版本的 prompt 模板
- **Evaluate**：批量调用模型进行 A/B 对比和评分

---

## 关键技术决策

| 决策 | 选型 | 理由 |
|------|------|------|
| 模型接口 | `@ai-sdk/openai-compatible` + `ai` | 官方推荐，支持 OpenAI/Claude/DeepSeek 等任意兼容接口 |
| CLI 解析 | `commander` | 轻量、易用、Node.js 标准 |
| CSV 处理 | `fast-csv` | 流式处理，适合大型数据集 |
| 运行时 | `tsx` | 直接运行 TypeScript，无需编译步骤 |

---

## 环境变量配置

项目使用 `.env` 文件配置 API 密钥和模型参数（模板见 `.env.example`）：

```bash
OPENAI_API_KEY=your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4-turbo
```

支持 OpenAI 兼容格式的大模型服务（Claude、DeepSeek、One-API 等）。

---

## 扩展提示

如需添加新功能，请参考 `design.md` 文档了解架构设计和扩展点。

**常见扩展场景**：
- 添加新的 prompt 版本：编辑 `src/prompt.ts`
- 切换模型：编辑 `src/generate.ts` 中的 `baseURL` 和 `apiKey`
- 添加评估维度：编辑 `src/evaluate/run.ts` 中的评分逻辑
