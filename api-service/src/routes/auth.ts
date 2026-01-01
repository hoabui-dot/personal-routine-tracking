import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import multer from 'multer';
import { query } from '../db';
import emailService from '../services/emailService';
import { uploadAvatar, deleteAvatar, extractKeyFromUrl } from '../services/s3Service';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d';

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
      return;
    }

    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Email already registered',
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const result = await query(
      `INSERT INTO users (name, email, password_hash, verification_token, verification_token_expires, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id, name, email, email_verified, created_at`,
      [name, email, passwordHash, verificationToken, verificationTokenExpires]
    );

    const user = result.rows[0];

    // Send verification email
    await emailService.sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.email_verified,
        },
        message: 'Registration successful. Please check your email to verify your account.',
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
    });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.email_verified,
        },
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
    });
  }
});

// Verify Email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Verification token is required',
      });
      return;
    }

    // Find user with token
    const result = await query(
      `SELECT * FROM users 
       WHERE verification_token = $1 
       AND verification_token_expires > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token',
      });
      return;
    }

    const user = result.rows[0];

    // Update user
    await query(
      `UPDATE users 
       SET email_verified = TRUE, 
           verification_token = NULL, 
           verification_token_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user.id]
    );

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.name);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify email',
    });
  }
});

// Forgot Password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
      });
      return;
    }

    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
      return;
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user
    await query(
      `UPDATE users 
       SET reset_password_token = $1, 
           reset_password_token_expires = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [resetToken, resetTokenExpires, user.id]
    );

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
    });
  }
});

// Reset Password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        error: 'Token and new password are required',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Find user with token
    const result = await query(
      `SELECT * FROM users 
       WHERE reset_password_token = $1 
       AND reset_password_token_expires > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
      return;
    }

    const user = result.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user
    await query(
      `UPDATE users 
       SET password_hash = $1, 
           reset_password_token = NULL, 
           reset_password_token_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
    });
  }
});

// Get Current User (protected route)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };

    const result = await query(
      'SELECT id, name, email, email_verified, avatar_url, created_at, last_login FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
});

// Upload Avatar (protected route)
router.post('/upload-avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    // Get current user to check for existing avatar
    const userResult = await query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const currentAvatarUrl = userResult.rows[0].avatar_url;

    // Delete old avatar if exists
    if (currentAvatarUrl) {
      const oldKey = extractKeyFromUrl(currentAvatarUrl);
      if (oldKey) {
        try {
          await deleteAvatar(oldKey);
        } catch (error) {
          console.error('Error deleting old avatar:', error);
          // Continue even if deletion fails
        }
      }
    }

    // Upload new avatar
    const { url } = await uploadAvatar(req.file, decoded.userId);

    console.log('Avatar upload - User ID:', decoded.userId, 'URL:', url);

    // Update user avatar_url
    await query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [url, decoded.userId]
    );

    console.log('Avatar URL saved to database successfully');

    res.json({
      success: true,
      data: {
        avatar_url: url,
      },
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar',
    });
  }
});

// Delete Avatar (protected route)
router.delete('/delete-avatar', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };

    // Get current user avatar
    const userResult = await query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const currentAvatarUrl = userResult.rows[0].avatar_url;

    if (currentAvatarUrl) {
      const key = extractKeyFromUrl(currentAvatarUrl);
      if (key) {
        try {
          await deleteAvatar(key);
        } catch (error) {
          console.error('Error deleting avatar from S3:', error);
        }
      }
    }

    // Remove avatar_url from database
    await query(
      'UPDATE users SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [decoded.userId]
    );

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete avatar',
    });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', async (_: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
