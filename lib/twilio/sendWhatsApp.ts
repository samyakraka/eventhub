// If you see a type error below, make sure to run: npm install twilio @types/twilio
// import twilio from 'twilio'
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const from = process.env.TWILIO_FROM!;

const client = twilio(accountSid, authToken);

/**
 * Send a WhatsApp message using Twilio Sandbox
 * @param to - WhatsApp number in format 'whatsapp:+1234567890'
 * @param body - Message body
 */
export async function sendWhatsAppMessage(to: string, body: string) {
  try {
    const message = await client.messages.create({
      from,
      to,
      body,
    });
    console.log('WhatsApp message sent. SID:', message.sid);
    return message;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    throw error;
  }
} 
