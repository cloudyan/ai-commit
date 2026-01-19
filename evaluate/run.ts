import { generate } from '../src/generate';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'node:url';
import { config } from '../src/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Row {
  diff: string;
  ground_truth: string;
  type: string;
  breaking: boolean;
}

async function loadDataset(): Promise<Row[]> {
  const rows: Row[] = [];
  const filePath = path.join(__dirname, 'dataset.jsonl');

  try {
    const fileStream = createReadStream(filePath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        try {
          const parsed = JSON.parse(trimmedLine);
          // 验证必需字段
          if (parsed.diff && parsed.ground_truth && parsed.type) {
            rows.push({
              diff: parsed.diff,
              ground_truth: parsed.ground_truth,
              type: parsed.type,
              breaking: parsed.breaking || false
            });
          } else {
            console.warn('跳过无效的数据行，缺少必需字段:', trimmedLine);
          }
        } catch (error) {
          console.warn('跳过无效的JSON行:', trimmedLine);
        }
      }
    }

    if (rows.length === 0) {
      throw new Error('数据集为空或格式错误');
    }

    console.log(`成功加载 ${rows.length} 条测试数据`);
    return rows;

  } catch (error) {
    throw new Error(`加载数据集失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

async function evaluate(model: string, promptVer: 'prompt_A' | 'prompt_B' | 'prompt_C') {
  const data = await loadDataset();
  let style = 0, semantic = 0, safety = 0;
  let totalProcessed = 0;

  console.log(`正在评估模型: ${model}, prompt版本: ${promptVer}`);

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    try {
      const pred = await generate({diff: r.diff, model, promptVer});

      // style检查
      const typeOk = pred.subject.startsWith(r.type);
      const lenOk = pred.subject.length <= 50;
      const imperativeOk = !/^(updated?|modified?|changed?|fixed?)\s/i.test(pred.subject);

      // semantic检查
      const groundTruthParts = r.ground_truth.split(':');
      const expectedContent = groundTruthParts.length > 1 ? groundTruthParts[1].trim() : r.ground_truth;
      const semOk = pred.subject.toLowerCase().includes(expectedContent.toLowerCase());

      // safety检查
      const safe = !/sk-\w{20,}/i.test(pred.subject + pred.body) &&
                   !/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(pred.subject + pred.body) &&
                   !/\b(?:10|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/.test(pred.subject + pred.body);

      if (typeOk && lenOk && imperativeOk) style++;
      if (semOk) semantic++;
      if (safe) safety++;

      totalProcessed++;

      // 显示进度
      if ((i + 1) % 10 === 0) {
        console.log(`  进度: ${i + 1}/${data.length}`);
      }

    } catch (error) {
      console.warn(`  跳过第 ${i + 1} 条数据，生成失败:`, error instanceof Error ? error.message : '未知错误');
    }
  }

  if (totalProcessed === 0) {
    throw new Error('没有成功处理任何数据');
  }

  const results = {
    model,
    promptVer,
    style: style / totalProcessed,
    semantic: semantic / totalProcessed,
    safety: safety / totalProcessed,
    processed: totalProcessed,
    total: data.length
  };

  console.log(`  完成! 成功处理 ${totalProcessed}/${data.length} 条数据`);
  return results;
}

(async () => {
  try {
    const compare = process.argv.includes('--compare');
    const models = [config.modelName()];
    const versions: ('prompt_A' | 'prompt_B' | 'prompt_C')[] = ['prompt_A', 'prompt_B', 'prompt_C'];
    const table: any[] = [];

    console.log(`使用模型: ${models.join(', ')}`);
    console.log('开始评估...');
    console.log('='.repeat(60));

    console.log('开始评估...');
    console.log('='.repeat(60));

    for (const m of models) {
      for (const p of versions) {
        try {
          const result = await evaluate(m, p);
          table.push(result);
        } catch (error) {
          console.error(`评估失败 (${m}, ${p}):`, error instanceof Error ? error.message : '未知错误');
        }
      }
    }

    if (table.length === 0) {
      console.error('所有评估都失败了');
      process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('评估结果:');
    console.log('='.repeat(60));

    // 格式化输出结果
    const formattedTable = table.map(result => ({
      '模型': result.model,
      'Prompt': result.promptVer,
      '风格分': `${(result.style * 100).toFixed(1)}%`,
      '语义分': `${(result.semantic * 100).toFixed(1)}%`,
      '安全分': `${(result.safety * 100).toFixed(1)}%`,
      '处理数': `${result.processed}/${result.total}`
    }));

    console.table(formattedTable);

    if (compare) {
      // 按总分排序（降序）
      const sortedTable = table.sort((a, b) =>
        (b.style + b.semantic + b.safety) - (a.style + a.semantic + a.safety)
      );
      const best = sortedTable[0];

      console.log('\n' + '='.repeat(60));
      console.log('🏆 最佳组合:');
      console.log(`模型: ${best.model}`);
      console.log(`Prompt版本: ${best.promptVer}`);
      console.log(`总分: ${((best.style + best.semantic + best.safety) * 100 / 3).toFixed(1)}%`);
      console.log(`风格分: ${(best.style * 100).toFixed(1)}%`);
      console.log(`语义分: ${(best.semantic * 100).toFixed(1)}%`);
      console.log(`安全分: ${(best.safety * 100).toFixed(1)}%`);
      console.log('='.repeat(60));
    }

  } catch (error) {
    console.error('评估过程出错:', error instanceof Error ? error.message : '未知错误');
    process.exit(1);
  }
})();
