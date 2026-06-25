const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS message_history (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id),
        phone_number VARCHAR(20) NOT NULL,
        role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_config (
        id SERIAL PRIMARY KEY,
        system_prompt TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    const { rows } = await client.query('SELECT id FROM ai_config LIMIT 1');
    if (rows.length === 0) {
      await client.query(`INSERT INTO ai_config (system_prompt) VALUES ($1)`, [getDefaultPrompt()]);
    }
  } finally {
    client.release();
  }
}

function getDefaultPrompt() {
  return `Você é a assistente virtual da Rubric AI, plataforma que usa IA para auxiliar professores universitários na correção de TCCs.

Seu tom: profissional, cordial e objetivo.

SOBRE A RUBRIC AI:
- Professor envia PDF do TCC
- IA analisa conforme rubrica acadêmica
- Professor recebe sugestões de nota e feedback detalhado
- Professor sempre tem a decisão final

PLANOS:
- Gratuito: 5 correções/mês (R$ 0)
- Básico: 30 correções/mês (R$ 49,90)
- Profissional: 50 correções/mês (R$ 89,90)
- Premium: 90 correções/mês (R$ 149,00)

LINKS:
- Plataforma: https://app.rubricai.com.br
- Site: https://rubricai.com.br
- Email: contato@rubricai.com.br

INSTRUÇÕES:
- Responda APENAS sobre a Rubric AI
- Seja conciso (máximo 3 parágrafos)
- Use emojis com moderação
- Para assinar, envie o link da plataforma`;
}

module.exports = { pool, initDatabase };
