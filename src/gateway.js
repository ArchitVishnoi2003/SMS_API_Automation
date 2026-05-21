const axios = require('axios');

const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL || 'https://api.sms-gate.app/3rdparty/v1';

async function sendSms(phoneNumber, message) {
  const username = process.env.SMS_GATEWAY_USERNAME;
  const password = process.env.SMS_GATEWAY_PASSWORD;

  if (!username || !password) {
    throw new Error('SMS_GATEWAY_USERNAME and SMS_GATEWAY_PASSWORD must be set in .env');
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  const response = await axios.post(
    `${SMS_GATEWAY_URL}/message`,
    { message, phoneNumbers: [phoneNumber] },
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  return response.data;
}

module.exports = { sendSms };
