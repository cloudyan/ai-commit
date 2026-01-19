# 开发调试指南

本文档用于开发时快速测试和调试 `ai-commit` 功能。

## 快速测试（跳过 Git 操作）

在开发时，可以使用以下选项跳过 Git 操作，直接测试 commit message 生成功能：

### 方式 1：直接传入 diff 内容

```bash
# 简单 diff
npm run dev -- --diff "@@ -1 +1 @@\n- old line\n+ new line"

# 复杂 diff（使用换行符 \n）
npm run dev -- --diff "@@ -10,12 +10,6 @@\n- function old() {\n-   return null;\n- }\n+ function new() {\n+   return cache.get(id);\n+ }"
```

### 方式 2：从文件读取 diff

```bash
# 使用单个测试文件
npm run dev -- --diff-file data/test-diff.txt

# 使用批量测试数据
npm run dev -- --diff-file data/test-diffs.txt
```

### 方式 3：使用测试样本目录

```bash
# 测试 feat 类型
npm run dev -- --diff-file data/test-samples/01-feat-api-env.txt

# 测试 chore 类型
npm run dev -- --diff-file data/test-samples/02-chore-remove-debug.txt

# 测试 fix 类型
npm run dev -- --diff-file data/test-samples/03-fix-null-check.txt
```

## 测试数据说明

### data/ 目录

| 文件 | 说明 |
|------|------|
| test-diff.txt | 单个 diff 测试样本 |
| test-diffs.txt | 批量 diff 测试数据（20个用例） |
| test-diff-reader.ts | diff 内容查看工具（显示统计信息） |
| test-samples/ | diff 测试样本目录 |

### data/test-samples/ 目录

| 文件 | 类型 | 说明 |
|------|------|------|
| 01-feat-api-env.txt | feat | 新增功能 - 从环境变量加载 API key |
| 02-chore-remove-debug.txt | chore | 杂项 - 移除调试日志 |
| 03-fix-null-check.txt | fix | 修复 - 处理空值检查 |
| 04-feat-add-auth.txt | feat | 新增 - 添加用户认证 |
| 05-docs-jsdoc.txt | docs | 文档 - 添加 JSDoc 注释 |
| 06-style-formatting.txt | style | 格式 - 代码格式化 |
| 07-test-add-unit.txt | test | 测试 - 添加单元测试 |
| 08-feat-breaking-change.txt | feat | 破坏性变更 - 修改 API base URL |
| 09-fix-add-await.txt | fix | 修复 - 添加 await 关键字 |

## 测试场景

### 验证输出格式

```bash
# 运行测试
npm run dev -- --diff-file test-samples/01-feat-api-env.txt

# 验证输出是否符合 Conventional Commits 规范
# 应该输出类似：
# feat: 从环境变量加载 API key
# 或
# chore: 移除调试日志
```

### 验证不同 Prompt 版本

```bash
# 使用 Prompt A
npm run dev -- --prompt A -- --diff-file test-samples/01-feat-api-env.txt

# 使用 Prompt B
npm run dev -- --prompt B -- --diff-file test-samples/01-feat-api-env.txt
```

### 验证不同模型

```bash
# 使用 GPT-3.5
npm run dev -- --model gpt-3.5-turbo -- --diff-file test-samples/01-feat-api-env.txt

# 使用 GPT-4
npm run dev -- --model gpt-4o -- --diff-file test-samples/01-feat-api-env.txt
```

### 查看 diff 统计信息

```bash
# 使用查看工具分析 diff
tsx data/test-diff-reader.ts test-samples/01-feat-api-env.txt

# 输出示例：
# 读取文件: test-samples/01-feat-api-env.txt
#
# === Diff内容 ===
# @@ -1 +1 @@
# - const API_KEY = 'sk-123'
# + const API_KEY = process.env.API_KEY
#
# === 统计信息 ===
# 字符数: 75
# 行数: 3
# 是否包含 feat: true
# 是否包含 fix: false
```

## 创建自定义测试样本

### 快速创建单个测试

```bash
# 使用 cat 创建测试文件
cat > data/my-test.txt << 'EOF'
@@ -5,7 +5,6 @@
- console.log('debug')
+ // removed debug log
EOF
```

### 批量创建测试

```bash
# 复制现有样本
cp test-samples/01-feat-api-env.txt test-samples/10-my-feat.txt

# 编辑新样本
vim test-samples/10-my-feat.txt
```

## 开发工作流示例

### 快速迭代开发流程

```bash
# 1. 修改代码后创建测试 diff
cat > data/my-test.txt << 'EOF'
@@ -5,7 +5,6 @@
- console.log('debug')
+ // removed debug log
EOF

# 2. 测试生成（无需 git 操作）
npm run dev -- --diff-file data/my-test.txt

# 3. 验证输出是否符合 Conventional Commits 规范
# 应该输出：chore: 移除调试日志
```

### 完整测试流程

```bash
# 1. 修改代码

# 2. 创建测试 diff
cat > data/test-diff.txt << 'EOF'
@@ -1 +1 @@
-old: const old()
+new: const new()
EOF

# 3. 快速测试（使用开发选项）
npm run dev -- --diff-file data/test-diff.txt

# 4. 如果满意，实际测试
git add .
npm run dev

# 5. 提交
git commit -F -
```

## 注意事项

1. **跳过 Git 操作**：使用 `--diff` 或 `--diff-file` 时，不会执行任何 git 命令
2. **正常模式**：不使用这两个选项时，会从 git 暂存区获取真实的 diff
3. **Amend 模式**：`--amend` 选项会获取上一次提交的 diff 进行重新生成
4. **测试数据位置**：
   - 单个测试：`data/test-diff.txt`
   - 批量测试：`data/test-diffs.txt`
   - 测试样本：`test-samples/*.txt`
5. **查看工具**：`data/test-diff-reader.ts` 可用于查看 diff 文件内容

## 常见问题

### Q: 如何测试中文 prompt？

A: 直接使用中文 prompt 版本即可，无需特殊配置：

```bash
npm run dev -- --prompt A -- --diff-file test-samples/01-feat-api-env.txt
```

### Q: 如何查看 diff 内容和统计？

A: 使用 diff 查看工具：

```bash
# 查看单个文件
tsx data/test-diff-reader.ts data/test-diff.txt

# 查看批量数据
tsx data/test-diff-reader.ts data/test-diffs.txt
```

### Q: 如何模拟真实的 commit 流程？

A: 不使用开发选项，让工具从真实的 git 暂存区读取：

```bash
# 1. 创建测试文件
echo 'console.log("test")' > test.js

# 2. 暂存文件
git add test.js

# 3. 正常运行（不使用开发选项）
npm run dev
```

### Q: 如何快速验证多个样本？

A: 使用脚本批量测试：

```bash
#!/bin/bash
# 方式 1：使用 test-samples
for file in test-samples/*.txt; do
  echo "Testing: $file"
  npm run dev -- --diff-file "$file"
done

# 方式 2：使用 data 目录
for i in {1..9}; do
  printf -v i "test-samples/%02d-*.txt" | xargs npm run dev -- --diff-file
done
```

## 测试脚本辅助

创建便捷脚本进行批量测试：

```bash
#!/bin/bash
# run-all-tests.sh

echo "开始运行所有测试样本..."

for file in test-samples/*.txt; do
  filename=$(basename "$file")
  echo "========================================="
  echo "测试: $filename"
  echo "========================================="
  npm run dev -- --diff-file "$file" --prompt A
  echo ""
done
```

使用方式：

```bash
# 添加执行权限
chmod +x run-all-tests.sh

# 运行所有测试
./run-all-tests.sh
```

