#!/usr/bin/env tsx
import { program } from 'commander';
import { generate } from './generate.js';
import { execSync } from 'child_process';

program
  .name('ai-commit')
  .option('-m, --model <model>', 'model name', 'gpt-3.5-turbo')
  .option('-p, --prompt <ver>', 'prompt version', 'A')
  .action(async (opts) => {
    const diff = execSync('git diff --cached', { encoding: 'utf8' });
    if (!diff) return console.log('No staged changes.');
    const msg = await generate(diff, opts.model, opts.prompt as 'A' | 'B');
    console.log(msg.subject);
    if (msg.body) console.log('\n' + msg.body);
  });

program.parse();
