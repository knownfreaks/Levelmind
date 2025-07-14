// utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVICE_HOST,
  port: process.env.EMAIL_SERVICE_PORT,
  secure: process.env.EMAIL_SERVICE_PORT === '465', // Use true for port 465, false for other ports like 587
  auth: {
    user: process.env.EMAIL_SERVICE_USER,
    pass: process.env.EMAIL_SERVICE_PASS,
  },
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"Recruitment Platform" <${process.env.EMAIL_SERVICE_USER}>`, // Sender address
      to: to, // List of receivers
      subject: subject, // Subject line
      html: htmlContent, // HTML body
    };

    let info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    // Preview URL only for Ethereal accounts
    if (process.env.EMAIL_SERVICE_HOST === 'smtp.ethereal.email') {
      console.log('Ethereal Email Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendEmail
};