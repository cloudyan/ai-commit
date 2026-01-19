async function testDirectFetch() {
  const API_KEY = process.env.OPENAI_API_KEY;
  const BASE_URL = 'https://apis.iflow.cn/v1';
  const MODEL = 'glm-4.6';

  console.log('直接测试 iFlow API...');
  console.log('API Key:', API_KEY ? '已配置' : '未配置');
  console.log('Base URL:', BASE_URL);
  console.log('Model:', MODEL);

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'user', content: '你说"测试成功"' }
      ],
      max_tokens: 20,
      temperature: 0.3,
    }),
  });

  console.log('\nHTTP 状态码:', response.status);
  console.log('Content-Type:', response.headers.get('content-type'));

  const text = await response.text();
  console.log('\n响应内容:');
  console.log(text);

  if (response.ok) {
    try {
      const json = JSON.parse(text);
      console.log('\n解析后的 JSON:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.error('\nJSON 解析失败:', e);
    }
  }
}

testDirectFetch();
