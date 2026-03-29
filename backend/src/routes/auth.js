const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/signup
 * Create user with email/password
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || ''
      }
    });

    if (error) {
      return res.status(400).json({
        error: 'Signup Failed',
        message: error.message
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user'
    });
  }
});

/**
 * POST /api/auth/login
 * Sign in with email/password, return JWT tokens
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        error: 'Login Failed',
        message: error.message
      });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sign in'
    });
  }
});

/**
 * POST /api/auth/logout
 * Sign out user
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Invalidate the session using admin API
    const { error } = await supabaseAdmin.auth.admin.signOut(req.token);

    if (error) {
      console.warn('Logout warning:', error.message);
    }

    res.json({
      message: 'Logout successful'
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sign out'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user (protected route)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.user_metadata?.full_name,
        createdAt: req.user.created_at,
        lastSignIn: req.user.last_sign_in_at
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required'
      });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({
        error: 'Refresh Failed',
        message: error.message
      });
    }

    res.json({
      message: 'Token refreshed successfully',
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to refresh token'
    });
  }
});

module.exports = router;
