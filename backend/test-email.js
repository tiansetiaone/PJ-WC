const nodemailer = require('nodemailer');
require('dotenv').config(); // Make sure to load .env file

async function testSMTP() {
  console.log('Testing SMTP connection with:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER
  });

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // for development only
    }
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Test Sender" <${process.env.EMAIL_FROM}>`,
      to: 'recipient@example.com',
      subject: 'SMTP Test Email',
      text: 'This is a test email from your application',
      html: '<b>This is a test email from your application</b>'
    });
    
    console.log('✅ Test email sent successfully!', {
      messageId: info.messageId,
      previewURL: nodemailer.getTestMessageUrl(info)
    });
  } catch (error) {
    console.error('❌ SMTP Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    if (error.response) {
      console.error('SMTP Server Response:', error.response);
    }
  }
}

testSMTP();