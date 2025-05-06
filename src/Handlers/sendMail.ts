// emailSender.ts
import nodemailer from 'nodemailer';

export async function sendEmail(to: string, subject: string, text: string): Promise<string> {
  // 1. Create transporter
  console.log("process" , process.env.EMAIL_USER)
  console.log("process" , process.env.EMAIL_PASS)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // your email address
      pass: process.env.EMAIL_PASS  // your email password or app password
    }
  });

  // 2. Send mail
  const info = await transporter.sendMail({
    from: `"Your Name or App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  });

  console.log(`Email sent: ${info.messageId}`);
  return info.messageId;
}
