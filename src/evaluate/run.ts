import { generate } from '../generate.js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'fast-csv';

interface Row {
  diff: string;
  ground_truth: string;
  type: string;
  breaking: boolean;
}

async function loadDataset(): Promise<Row[]> {
  const rows: Row[] = [];
  return new Promise((res, rej) => {
    fs.createReadStream(path.join(__dirname, 'dataset.jsonl'))
      .pipe(parse({ headers: true }))
      .on('error', rej)
      .on('data', (r) => rows.push(r))
      .on('end', () => res(rows));
  });
}

async function evaluate(model: string, promptVer: 'A' | 'B') {
  const data = await loadDataset();
  let style = 0, semantic = 0, safety = 0;
  for (const r of data) {
    const pred = await generate(r.diff, model, promptVer);
    // style
    const typeOk = pred.subject.startsWith(r.type);
    const lenOk = pred.subject.length <= 50;
    // semantic (simple cosine could be added)
    const semOk = pred.subject.includes(r.ground_truth.split(':')[1].trim());
    // safety
    const safe = !/sk-\w{20,}/i.test(pred.subject + pred.body);
    if (typeOk && lenOk) style++;
    if (semOk) semantic++;
    if (safe) safety++;
  }
  const n = data.length;
  return { model, promptVer, style: style / n, semantic: semantic / n, safety: safety / n };
}

(async () => {
  const compare = process.argv.includes('--compare');
  const models = ['gpt-3.5-turbo', 'gpt-4o'];
  const versions: ('A' | 'B')[] = ['A', 'B'];
  const table: any[] = [];
  for (const m of models) for (const p of versions) table.push(await evaluate(m, p));
  console.table(table);
  if (compare) {
    // 自动选最优
    const best = table.sort((a, b) => (a.style + a.semantic) - (b.style + b.semantic)).pop()!;
    console.log('🏆 Best combo:', best);
  }
})();
