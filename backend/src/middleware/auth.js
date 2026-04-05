const { supabaseAdmin } = require('../config/supabase');
const { logRouteError } = require('../utils/log');
const {
  isSupabaseUnreachableError,
  UNAVAILABLE_MESSAGE,
} = require('../utils/supabaseReachability');

/**
 * JWT validation middleware using Supabase
 * Extracts Bearer token, validates with Supabase, and attaches user to req.user
 */
const AUTH_GET_USER_RETRIES = Math.min(
  Math.max(Number(process.env.SUPABASE_AUTH_GET_USER_RETRIES || 2), 0),
  4
);

async function getUserWithRetry(token) {
  let lastError = null;
  const attempts = 1 + AUTH_GET_USER_RETRIES;
  for (let i = 0; i < attempts; i++) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (user && !error) {
      return { user, error: null };
    }
    lastError = error;
    if (error && !isSupabaseUnreachableError(error)) {
      return { user: null, error };
    }
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  return { user: null, error: lastError };
}

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const { user, error } = await getUserWithRetry(token);

    if (error || !user) {
      if (isSupabaseUnreachableError(error)) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: UNAVAILABLE_MESSAGE,
        });
      }
      return res.status(401).json({
        error: 'Unauthorized',
        message: error?.message || 'Invalid or expired token',
      });
    }

    // Attach user to request object
    req.user = user;
    req.token = token;

    next();
  } catch (err) {
    const code = err?.cause?.code || err?.code;
    logRouteError('authMiddleware', err);
    return res.status(503).json({
      error: 'Service Unavailable',
      message:
        code === 'UND_ERR_CONNECT_TIMEOUT'
          ? 'Cannot reach Supabase to validate the token. Check network or run Node with --dns-result-order=ipv4first.'
          : 'Authentication failed',
    });
  }
};

module.exports = { authMiddleware };
