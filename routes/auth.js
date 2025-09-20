import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '../utils/db.js';
import { sendVerificationEmail } from '../utils/email.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.execute(
      'INSERT INTO users (email, password_hash, verification_token, token_expiry) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, token, expiry]
    );

    await sendVerificationEmail(email, token);

    res.status(200).json({ message: 'User registered. Verification email sent.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  }

});

router.get('/verify', async (req, res) => {
  const { token } = req.query;

  try {
    const [rows] = await db.execute(
      'SELECT id, token_expiry FROM users WHERE verification_token = ?',
      [token]
    );

    if (!rows.length) return res.status(400).send('Invalid token');

    const user = rows[0];

    if (new Date(user.token_expiry) < new Date()) {
      return res.status(400).send('Token expired');
    }

    await db.execute(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL, token_expiry = NULL WHERE id = ?',
      [user.id]
    );

    res.send('Email verified successfully! You can now log in.');
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).send('Verification failed');
  }
});

export default router;
