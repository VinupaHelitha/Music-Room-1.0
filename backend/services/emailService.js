import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY || process.env.EMAIL_PASSWORD;
const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

const isConfigValid = Boolean(resendApiKey);

if (!isConfigValid) {
  console.warn('No Resend API key found. Set RESEND_API_KEY or EMAIL_PASSWORD. Email delivery disabled.');
}

const resend = isConfigValid ? new Resend(resendApiKey) : null;

export const verifyEmailTransporter = async () => {
  if (!isConfigValid) {
    console.warn('Email configuration incomplete. Verification codes will be logged to console.');
    return { success: true, warning: 'Email delivery disabled; codes will be logged.' };
  }
  console.log('Email transporter (Resend HTTP API) configured and ready');
  return { success: true };
};

export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmail = async (to, subject, text, html) => {
  if (!isConfigValid) {
    console.warn(`EMAIL LOG: ${subject} -> ${to}`);
    return { success: true, warning: 'Email logging only — no API key configured.' };
  }
  try {
    const { error } = await resend.emails.send({ from: emailFrom, to, subject, text, html });
    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: err.message };
  }
};

export const sendVerificationEmail = async (email, name, code) => {
  return sendEmail(
    email,
    'Music Room - Email Verification',
    `Welcome to Music Room, ${name}!\n\nYour verification code is: ${code}\n\nThis code expires in 15 minutes.`,
    `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2>🎵 Music Room</h2>
      <p>Welcome, <strong>${name}</strong>! Please verify your email address.</p>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing:8px;color:#6366f1;font-size:36px">${code}</h1>
      <p style="color:#888">This code expires in 15 minutes.</p>
    </div>`
  );
};

export const sendPasswordResetEmail = async (email, name, code) => {
  return sendEmail(
    email,
    'Music Room - Password Reset',
    `Password reset code for Music Room: ${code}. Expires in 15 minutes.`,
    `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2>🎵 Music Room</h2>
      <p>Hi <strong>${name}</strong>, here is your password reset code:</p>
      <h1 style="letter-spacing:8px;color:#6366f1;font-size:36px">${code}</h1>
      <p style="color:#888">This code expires in 15 minutes.</p>
    </div>`
  );
};

export const sendDeleteAccountEmail = async (email, name, code) => {
  return sendEmail(
    email,
    'Music Room - Account Deletion Request',
    `Your account deletion verification code: ${code}. Expires in 15 minutes.`,
    `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2>🎵 Music Room</h2>
      <p>Hi <strong>${name}</strong>, your account deletion code is:</p>
      <h1 style="letter-spacing:8px;color:#ef4444;font-size:36px">${code}</h1>
      <p style="color:#888">This code expires in 15 minutes.</p>
    </div>`
  );
};
