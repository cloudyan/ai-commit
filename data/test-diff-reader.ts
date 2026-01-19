#!/usr/bin/env tsx
import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

program
  .name('test-diff-reader')
  .argument('<file>', 'diff文件路径')
  .action((file) => {
    const filePath = path.resolve(process.cwd(), file);
    console.log(`读取文件: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.error('错误: 文件不存在');
      process.exit(1);
    }

    const diff = fs.readFileSync(filePath, 'utf-8');
    console.log(`\n=== Diff内容 ===`);
    console.log(diff);
    console.log(`\n=== 统计信息 ===`);
    console.log(`字符数: ${diff.length}`);
    console.log(`行数: ${diff.split('\n').length}`);
    console.log(`是否包含feat: ${diff.includes('feat') || diff.includes('+')}`);
    console.log(`是否包含fix: ${diff.includes('fix')}`);
  });

program.parse();
