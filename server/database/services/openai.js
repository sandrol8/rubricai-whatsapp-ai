const OpenAI = require('openai');
const { getHistory, getSystemPrompt, saveMessage } = require('../database/queries');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function processMessage(phoneNumber, userMessage) {
  await saveMessage(phoneNumber, 'user', userMessage);

  const [history, systemPrompt] = await Promise.all([
    getHistory(phoneNumber, 10),
    getSystemPrompt()
  ]);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content }))
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 500,
    temperature: 0.7
  });

  const aiReply = response.choices[0].message.content;
  await saveMessage(phoneNumber, 'assistant', aiReply);
  return aiReply;
}

module.exports = { processMessage };
