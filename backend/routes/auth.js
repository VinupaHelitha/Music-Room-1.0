import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/init.js';
import { generateToken } from '../middleware/auth.js';
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail, sendDeleteAccountEmail } from '../services/emailService.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDatabase();

    // Check if user exists
    const existingResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered. Please login or use another email.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Start transaction
    await db.query('BEGIN');

    try {
      await db.query(
        `INSERT INTO users (id, email, password, name, verification_code, verification_code_expires)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, email, hashedPassword, name, verificationCode, verificationCodeExpires]
      );

      // Send verification email
      const emailResult = await sendVerificationEmail(email, name, verificationCode);
      if (!emailResult.success) {
        console.error('Verification email failed:', emailResult.error);
        await db.query('ROLLBACK');
        return res.status(500).json({ error: 'Verification email could not be sent. Please check email configuration.' });
      }

      await db.query('COMMIT');

      res.status(201).json({
        message: 'Registration successful. Check your email for verification code.',
        userId,
        email,
        name
      });
    } catch (transactionError) {
      await db.query('ROLLBACK');
      console.error('Registration transaction error:', transactionError);
      res.status(500).json({ error: 'Registration failed' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code required' });
    }

    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if code is correct and not expired
    if (user.verification_code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date(user.verification_code_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    // Mark email as verified
    await db.query(
      'UPDATE users SET email_verified = true, verification_code = NULL, verification_code_expires = NULL WHERE email = $1',
      [email]
    );

    const token = generateToken(user.id, user.email);
    res.json({
      message: 'Email verified successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Delete account request (send deletion code)
router.post('/delete-account-request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    const deleteCode = generateVerificationCode();
    const deleteCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    if (!user) {
      return res.json({ message: 'If this email exists, a deletion code has been sent.' });
    }

    await db.query(
      'UPDATE users SET delete_account_code = $1, delete_account_code_expires = $2 WHERE email = $3',
      [deleteCode, deleteCodeExpires, email]
    );

    const emailResult = await sendDeleteAccountEmail(email, user.name, deleteCode);
    if (!emailResult.success) {
      console.error('Delete account email failed:', emailResult.error);
      return res.status(500).json({ error: 'Failed to send deletion email. Please check email configuration.' });
    }

    res.json({ message: 'If this email exists, a deletion code has been sent.' });
  } catch (error) {
    console.error('Delete account request error:', error);
    res.status(500).json({ error: 'Failed to request account deletion' });
  }
});

// Delete account
router.post('/delete-account', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and deletion code are required' });
    }

    const db = getDatabase();

    // Fetch user
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.delete_account_code !== code) {
      return res.status(400).json({ error: 'Invalid deletion code' });
    }

    if (!user.delete_account_code_expires || new Date(user.delete_account_code_expires) < new Date()) {
      return res.status(400).json({ error: 'Deletion code expired' });
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Delete room songs for owned rooms
      await db.query(
        'DELETE FROM room_songs WHERE room_id IN (SELECT id FROM rooms WHERE creator_id = $1)',
        [user.id]
      );

      // Delete room members for owned rooms
      await db.query(
        'DELETE FROM room_members WHERE room_id IN (SELECT id FROM rooms WHERE creator_id = $1)',
        [user.id]
      );

      // Delete owned rooms
      await db.query('DELETE FROM rooms WHERE creator_id = $1', [user.id]);

      // Remove user from room memberships
      await db.query('DELETE FROM room_members WHERE user_id = $1', [user.id]);

      // Delete songs added by the user
      await db.query('DELETE FROM room_songs WHERE added_by = $1', [user.id]);

      // Delete linked music accounts
      await db.query('DELETE FROM user_music_accounts WHERE user_id = $1', [user.id]);

      // Delete user account
      await db.query('DELETE FROM users WHERE id = $1', [user.id]);

      // Commit transaction
      await db.query('COMMIT');

      res.json({ message: 'Account deleted successfully' });
    } catch (transactionError) {
      // Rollback transaction on error
      await db.query('ROLLBACK');

      console.error('Transaction error:', transactionError);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email first. Check your email for the verification code.' });
    }

    const token = generateToken(user.id, user.email);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot Password - Send Reset Code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: 'If email exists, reset code has been sent' });
    }

    const resetCode = generateVerificationCode();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.query(
      'UPDATE users SET password_reset_code = $1, password_reset_code_expires = $2 WHERE email = $3',
      [resetCode, resetCodeExpires, email]
    );

    const emailResult = await sendPasswordResetEmail(email, user.name, resetCode);
    if (!emailResult.success) {
      console.error('Password reset email failed:', emailResult.error);
      await db.query(
        'UPDATE users SET password_reset_code = NULL, password_reset_code_expires = NULL WHERE email = $1',
        [email]
      );
      return res.status(500).json({ error: 'Failed to send password reset code. Please check email configuration.' });
    }

    res.json({ message: 'If email exists, reset code has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Forgot password failed' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if code is correct and not expired
    if (user.password_reset_code !== code) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    if (new Date(user.password_reset_code_expires) < new Date()) {
      return res.status(400).json({ error: 'Reset code expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset code
    await db.query(
      'UPDATE users SET password = $1, password_reset_code = NULL, password_reset_code_expires = NULL WHERE email = $2',
      [hashedPassword, email]
    );

    res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

export default router;
