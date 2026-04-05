const { logRouteError } = require('./log');
const {
  isSupabaseUnreachableError,
  UNAVAILABLE_MESSAGE,
} = require('./supabaseReachability');

/**
 * True when the error likely indicates Supabase/PostgREST is unreachable (not a business logic error).
 */
function isInfrastructureUnavailableError(err) {
  if (!err) return false;
  if (isSupabaseUnreachableError(err)) return true;
  const msg = String(err.message || '');
  if (msg === 'fetch failed') return true;
  const code = err.code;
  if (
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND'
  ) {
    return true;
  }
  const cause = err.cause;
  if (cause && typeof cause === 'object') {
    if (isSupabaseUnreachableError(cause)) return true;
    const ccode = cause.code;
    if (
      ccode === 'UND_ERR_CONNECT_TIMEOUT' ||
      ccode === 'ETIMEDOUT' ||
      ccode === 'ECONNRESET' ||
      ccode === 'ECONNREFUSED'
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Log and respond with 503 for network/Supabase outages, else 500 with { success: false, error }.
 */
function respondRouteError(res, err, logScope) {
  logRouteError(logScope, err);
  if (isInfrastructureUnavailableError(err)) {
    return res.status(503).json({
      success: false,
      error: UNAVAILABLE_MESSAGE,
    });
  }
  return res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
}

module.exports = { respondRouteError, isInfrastructureUnavailableError };
