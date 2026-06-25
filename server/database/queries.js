const { pool } = require('./db');

async function getOrCreateConversation(phoneNumber) {
  await pool.query(
    `INSERT INTO conversations (phone_number) VALUES ($1) ON CONFLICT DO NOTHING`,
    [phoneNumber]
  );
  await pool.query(
    'UPDATE conversations SET updated_at = NOW() WHERE phone_number = $1',
    [phoneNumber]
  );
  const result = await pool.query(
    'SELECT id FROM conversations WHERE phone_number = $1',
    [phoneNumber]
  );
  return result.rows[0].id;
}

async function saveMessage(phoneNumber, role, content) {
  const convId = await getOrCreateConversation(phoneNumber);
  await pool.query(
    'INSERT INTO message_history (conversation_id, phone_number, role, content) VALUES ($1, $2, $3, $4)',
    [convId, phoneNumber, role, content]
  );
}

async function getHistory(phoneNumber, limit = 10) {
  const { rows } = await pool.query(
    `SELECT role, content FROM message_history
     WHERE phone_number = $1
     ORDER BY created_at DESC LIMIT $2`,
    [phoneNumber, limit]
  );
  return rows.reverse();
}

async function getSystemPrompt() {
  const { rows } = await pool.query(
    'SELECT system_prompt FROM ai_config ORDER BY id DESC LIMIT 1'
  );
  return rows[0]?.system_prompt || '';
}

async function updateSystemPrompt(prompt) {
  await pool.query(
    'UPDATE ai_config SET system_prompt = $1, updated_at = NOW()',
    [prompt]
  );
}

async function getStats() {
  const conversations = await pool.query('SELECT COUNT(*) FROM conversations');
  const messages = await pool.query('SELECT COUNT(*) FROM message_history');
  const today = await pool.query(
    "SELECT COUNT(*) FROM message_history WHERE created_at >= NOW() - INTERVAL '24 hours'"
  );
  return {
    totalConversations: parseInt(conversations.rows[0].count),
    totalMessages: parseInt(messages.rows[0].count),
    messagesToday: parseInt(today.rows[0].count)
  };
}

module.exports = { saveMessage, getHistory, getSystemPrompt, updateSystemPrompt, getStats };
