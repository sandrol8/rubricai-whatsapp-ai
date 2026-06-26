const express = require('express');
const router = express.Router();
const { processMessage } = require('../services/openai');
const { sendMessage } = require('../services/whatsapp');
const { getSystemPrompt, updateSystemPrompt, getStats } = require('../database/queries');

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verificado!');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

router.post('/', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) return;
    const msg = messages[0];
    if (msg.type !== 'text') return;
    const phoneNumber = msg.from;
    const userText = msg.text.body;
    console.log(`📩 Mensagem de ${phoneNumber}: ${userText}`);
    const aiReply = await processMessage(phoneNumber, userText);
    await sendMessage(phoneNumber, aiReply);
    console.log(`✅ Resposta enviada para ${phoneNumber}`);
  } catch (err) {
    console.error('❌ Erro no webhook:', err.message);
  }
});

router.get('/api/prompt', async (req, res) => {
  try {
    const prompt = await getSystemPrompt();
    res.json({ prompt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/prompt', async (req, res) => {
  try {
    await updateSystemPrompt(req.body.prompt);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/api/test', async (req, res) => {
  try {
    const { message, prompt } = req.body;
    const systemPrompt = prompt || await getSystemPrompt();
    const { OpenAI } = require('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500
    });
    const response = completion.choices[0].message.content;
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
