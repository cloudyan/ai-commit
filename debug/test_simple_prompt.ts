async function testSimplePrompt() {
  const response = await fetch(`${process.env.OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4.6',
      messages: [
        { role: 'system', content: '你是一个提交信息生成器。生成 JSON 格式的提交信息：{"subject":"xxx","body":"xxx","breaking":false}' },
        { role: 'user', content: 'diff: +import { generate } from "./generate.js";' }
      ],
      max_tokens: 200,
      temperature: 0.3,
    }),
  });

  console.log('状态码:', response.status);
  const data = await response.json();

  if (data.choices && data.choices.length > 0) {
    const text = data.choices[0].message.content;
    console.log('\n响应内容:');
    console.log(text);
    console.log('\n响应长度:', text.length);
  } else {
    console.log('响应:', JSON.stringify(data, null, 2));
  }
}

testSimplePrompt();
