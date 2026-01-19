#!/usr/bin/env tsx
import { program } from 'commander';
import { generate } from './generate.js';
import { getStagedDiff, getLastCommitDiff, isGitRepository, gitCommit } from './utils/git.js';
import { config } from './config.js';
import { getDefaultLanguage } from './utils.js';

program
  .name('ai-commit')
  .option('-m, --model <model>', 'model name', config.modelName())
  .option('-p, --prompt <ver>', 'prompt version', config.promptVersion())
  .option('-l, --language <lang>', 'language for commit message (zh or en)', getDefaultLanguage())
  .option('--amend', '修改上一次提交的message')
  .option('-d, --diff <diff>', '直接提供diff内容（开发测试用，跳过git操作）')
  .option('-f, --diff-file <file>', '从文件读取diff内容（开发测试用，跳过git操作）')
  .action(async (opts) => {
    try {
      if (!['prompt_A', 'prompt_B', 'prompt_C'].includes(opts.prompt)) {
        console.error('错误: prompt版本必须是prompt_A、prompt_B或prompt_C');
        process.exit(1);
      }

      let diff: string;
      const cwd = process.cwd();

      // 开发模式：直接使用提供的diff或从文件读取
      if (opts.diff) {
        console.log('开发模式：使用直接提供的diff');
        diff = opts.diff;
      } else if (opts.diffFile) {
        console.log(`开发模式：从文件读取diff: ${opts.diffFile}`);
        try {
          const fs = await import('fs');
          diff = fs.readFileSync(opts.diffFile, 'utf-8');
        } catch (error) {
          console.error('错误: 无法读取diff文件');
          console.error(error instanceof Error ? error.message : '未知错误');
          process.exit(1);
        }
      } else {
        // 正常模式：从git获取
        if (!(await isGitRepository(cwd))) {
          console.error('错误: 当前目录不是Git仓库');
          process.exit(1);
        }

        try {
          if (opts.amend) {
            console.log('正在获取上一次提交的变更...');
            diff = await getLastCommitDiff(cwd);
          } else {
            diff = await getStagedDiff(cwd);
          }
        } catch (error) {
          console.error('错误: 无法获取Git变更');
          console.error(error instanceof Error ? error.message : '未知错误');
          process.exit(1);
        }
      }

      if (!diff.trim()) {
        if (opts.amend) {
          console.log('上一次提交没有文件变更，无法修改message');
        } else if (opts.diff || opts.diffFile) {
          console.log('提供的diff为空，请提供有效的diff内容');
        } else {
          console.log('没有暂存的变更，请先运行 git add 添加文件');
        }
        return;
      }

      console.log(`正在生成提交信息${opts.amend ? '(修改模式)' : ''}...`);
      const msg = await generate({
        diff,
        model: opts.model,
        promptVer: opts.prompt as 'prompt_A' | 'prompt_B' | 'prompt_C',
        language: opts.language,
      });

      const fullMessage = msg.body ? `${msg.subject}\n\n${msg.body}` : msg.subject;

      console.log('\n' + '='.repeat(50));
      console.log('生成的提交信息:');
      console.log('='.repeat(50));
      console.log(msg.subject);
      if (msg.body) {
        console.log('\n' + msg.body);
      }
      console.log('='.repeat(50));

      if (msg.score && msg.score > 0) {
        console.log(`\n质量评分: ${msg.score}/100`);
        if (msg.reason) {
          console.log(`评分理由: ${msg.reason}`);
        }
      }

      if (opts.amend) {
        try {
          console.log('\n正在修改上一次提交...');
          await gitCommit(cwd, fullMessage, true);
          console.log('✓ 上一次提交已修改');
        } catch (error) {
          console.error('错误: 修改提交失败');
          console.error(error instanceof Error ? error.message : '未知错误');
          console.log('\n提示: 可以手动执行以下命令修改提交:');
          console.log(`git commit --amend -m "${fullMessage.replace(/\n/g, '\\n')}"`);
          process.exit(1);
        }
      } else if (!opts.diff && !opts.diffFile) {
        console.log('\n提示: 如果满意，可以使用以下命令提交:');
        console.log('  git commit -F -');
      }

      console.log(`\n当前模型: ${opts.model}, Prompt版本: ${opts.prompt}`);

    } catch (error) {
      console.error('错误:', error instanceof Error ? error.message : '生成提交信息失败');
      process.exit(1);
    }
  });

program.parse();
