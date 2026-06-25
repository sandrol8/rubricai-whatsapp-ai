const axios = require('axios');

const WA_API_URL = 'https://graph.facebook.com/v18.0';

async function sendMessage(phoneNumber, message) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  try {
    const response = await axios.post(
      `${WA_API_URL}/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`✅ Mensagem enviada para ${phoneNumber}`);
    return response.data;
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = { sendMessage };
