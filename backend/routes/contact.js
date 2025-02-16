const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configure nodemailer with your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',  // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER,     // Your email
    pass: process.env.EMAIL_PASSWORD  // Your email password or app-specific password
  }
});

router.post('/', async (req, res) => {
  console.log('Received contact form submission:', req.body); // Debug log

  const { name, company, email, message } = req.body;

  // Validate input
  if (!name || !email || !message) {
    console.log('Missing required fields'); // Debug log
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,  // Your admin email address
    subject: `⚠️ New Contact Form Submission from ${name} - ${company}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
    priority: 'high',
    headers: {
      'Importance': 'high',
      'X-Priority': '1',
      'X-MSMail-Priority': 'High'
    }
  };

  try {
    console.log('Attempting to send email with options:', mailOptions); // Debug log
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully'); // Debug log
    res.status(200).json({ message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Error submitting form', details: error.message });
  }
});

module.exports = router; 