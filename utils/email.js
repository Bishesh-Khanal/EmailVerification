import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export async function sendVerificationEmail(to, token) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMALI_HOST,
        port: process.env.EMALI_PORT,
        secure: true,
        auth: {
            user: process.env.EMALI_USER,
            pass: process.env.EMALI_PASS,
        },
        family: 4,
        tls: {
            rejectUnauthorized: false
        }
    });


  const verificationLink = `http://localhost:3000/auth/verify?token=${token}`;

  const info = await transporter.sendMail({
    from: `"No Reply" <${process.env.EMALI_USER}>`,
    to: 'bishesh.khanal25@gmail.com',
    subject: 'Verify Your Email',
    text: `Click this link to verify your email: ${verificationLink}`,
    html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
  });

  console.log('Verification email sent: %s', info.messageId);
}
//'142.251.12.108'