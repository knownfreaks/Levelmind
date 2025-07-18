// utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  // Use EMAIL_HOST, EMAIL_PORT, etc., to match your .env file
  host: process.env.EMAIL_HOST, // <--- CORRECTED NAME
  port: process.env.EMAIL_PORT, // <--- CORRECTED NAME
  // The secure option should be a boolean. Convert string 'true' to boolean true.
  // It should be true for port 465 (SSL) and false for port 587 (STARTTLS).
  secure: process.env.EMAIL_SECURE === 'true', // <--- CORRECTED NAME AND LOGIC
  auth: {
    user: process.env.EMAIL_USER, // <--- CORRECTED NAME
    pass: process.env.EMAIL_PASS, // <--- CORRECTED NAME
  },
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      // Use EMAIL_USER for the from address, and optionally EMAIL_FROM_NAME
      from: `"${process.env.EMAIL_FROM_NAME || "Levelminds"}" <${process.env.EMAIL_USER}>`, // <--- CORRECTED NAME
      to: to, // List of receivers
      subject: subject, // Subject line
      html: htmlContent, // HTML body
    };

    let info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    // Preview URL only for Ethereal accounts
    // Use EMAIL_HOST to check if it's Ethereal, not EMAIL_SERVICE_HOST
    if (process.env.EMAIL_HOST === 'smtp.ethereal.email') { // <--- CORRECTED NAME
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
