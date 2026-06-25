require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { initDatabase } = require('./database/db');
const whatsappWebhook = require('./webhooks/whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/webhook', whatsappWebhook);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'RubricAI WhatsApp AI', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await initDatabase();
    console.log('✅ Banco de dados inicializado');
    app.listen(PORT, () => {
      console.log(`🚀 RubricAI WhatsApp AI rodando na porta ${PORT}`);
      console.log(`📊 Painel admin: http://localhost:${PORT}/admin`);
    });
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err);
    process.exit(1);
  }
}

start();
