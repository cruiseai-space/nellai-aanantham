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

    // Validate JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

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
