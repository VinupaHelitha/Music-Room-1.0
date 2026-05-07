import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const emailService = process.env.EMAIL_SERVICE || 'gmail';
const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
const emailSecure = process.env.EMAIL_SECURE === 'true';
const emailRequireTLS = process.env.EMAIL_REQUIRE_TLS === 'true';
const emailFrom = process.env.EMAIL_FROM || emailUser;

const isEmailConfigValid = Boolean(emailUser && emailPassword && emailFrom && (emailHost || emailService));

if (!isEmailConfigValid) {
  console.warn('Email configuration is incomplete. Set EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM (or EMAIL_USER).');
}

const transportConfig = emailHost
  ? {
      host: emailHost,
      port: emailPort || 587,
      secure: emailSecure,
      auth: {
        user: emailUser,
        pass: emailPassword
      },
      requireTLS: emailRequireTLS
    }
  : {
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    };

const transporter = nodemailer.createTransport(transportConfig);

export const verifyEmailTransporter = async () => {
  if (!isEmailConfigValid) {
    const errorMessage = 'Invalid email transporter configuration';
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`${errorMessage}. Running in development will log email codes to the console.`);
      return { success: true, warning: 'Email disabled in development; codes will be logged.' };
    }

    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    await transporter.verify();
    console.log('Email transporter verified and ready to send messages');
    return { success: true };
  } catch (error) {
    console.error('Email transporter verification failed:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
};

/**
 * Generate a 6-digit random verification code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send verification code email
 */
export const sendVerificationEmail = async (email, name, code) => {
  try {
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Music Room - Email Verification',
      text: `Welcome to Music Room, ${name}!\n\nYour verification code is: ${code}\n\nThis code expires in 15 minutes. If you did not sign up, ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">🎵 Music Room</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Welcome to Music Room, ${name}!</h2>
            <p>Thank you for signing up. Please verify your email address to complete your account setup.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 14px; color: #666;">Your verification code is:</p>
              <h1 style="font-size: 48px; color: #667eea; letter-spacing: 8px; margin: 20px 0;">${code}</h1>
              <p style="font-size: 12px; color: #999;">This code will expire in 15 minutes</p>
            </div>
            <p>If you didn't sign up for this account, please ignore this email.</p>
          </div>
          <div style="padding: 20px; background: #333; color: white; text-align: center; font-size: 12px;">
            <p>&copy; 2024 Music Room. All rights reserved.</p>
          </div>
        </div>
      `
    };

    if (!isEmailConfigValid) {
      const errorMessage = 'Email credentials are not configured';
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`DEV EMAIL: ${mailOptions.subject} -> ${email} | code: ${code}`);
        console.log('Email body:', mailOptions.text);
        return { success: true, warning: 'Email logging enabled for development' };
      }
      console.error('Email send error:', errorMessage);
      return { success: false, error: errorMessage };
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, name, code) => {
  try {
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Music Room - Password Reset',
      text: `Password reset request for Music Room. Your reset code is: ${code}. This code expires in 15 minutes. If you did not request this, ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">🎵 Music Room</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Use the code below to reset your password.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 14px; color: #666;">Your password reset code is:</p>
              <h1 style="font-size: 48px; color: #667eea; letter-spacing: 8px; margin: 20px 0;">${code}</h1>
              <p style="font-size: 12px; color: #999;">This code will expire in 15 minutes</p>
            </div>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div style="padding: 20px; background: #333; color: white; text-align: center; font-size: 12px;">
            <p>&copy; 2024 Music Room. All rights reserved.</p>
          </div>
        </div>
      `
    };

    if (!isEmailConfigValid) {
      const errorMessage = 'Email credentials are not configured';
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`DEV EMAIL: ${mailOptions.subject} -> ${email} | code: ${code}`);
        console.log('Email body:', mailOptions.text);
        return { success: true, warning: 'Email logging enabled for development' };
      }
      console.error('Email send error:', errorMessage);
      return { success: false, error: errorMessage };
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

export const sendDeleteAccountEmail = async (email, name, code) => {
  try {
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Music Room - Account Deletion Request',
      text: `A request to delete your Music Room account was received. Your deletion code is: ${code}. This code expires in 15 minutes. If you did not request this, ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #e53e3e 0%, #dd6b20 100%); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">🎵 Music Room</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Account Deletion Request</h2>
            <p>We received a request to delete your Music Room account. Use the verification code below to confirm deletion.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 14px; color: #666;">Your deletion verification code is:</p>
              <h1 style="font-size: 48px; color: #e53e3e; letter-spacing: 8px; margin: 20px 0;">${code}</h1>
              <p style="font-size: 12px; color: #999;">This code will expire in 15 minutes</p>
            </div>
            <p>If you did not request to delete your account, please ignore this email and your account will remain unchanged.</p>
          </div>
          <div style="padding: 20px; background: #333; color: white; text-align: center; font-size: 12px;">
            <p>&copy; 2024 Music Room. All rights reserved.</p>
          </div>
        </div>
      `
    };

    if (!isEmailConfigValid) {
      const errorMessage = 'Email credentials are not configured';
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`DEV EMAIL: ${mailOptions.subject} -> ${email} | code: ${code}`);
        console.log('Email body:', mailOptions.text);
        return { success: true, warning: 'Email logging enabled for development' };
      }
      console.error('Email send error:', errorMessage);
      return { success: false, error: errorMessage };
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};
