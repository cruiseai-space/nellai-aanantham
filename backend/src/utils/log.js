/**
 * Structured, throttled logging so repeated Supabase/network failures do not flood the console.
 */

const throttleState = new Map();

function isConnectTimeout(err) {
  const code = err?.cause?.code ?? err?.code;
  return code === 'UND_ERR_CONNECT_TIMEOUT';
}

function throttle(key, ttlMs) {
  const now = Date.now();
  const last = throttleState.get(key) ?? 0;
  if (now - last < ttlMs) return false;
  throttleState.set(key, now);
  return true;
}

/**
 * @param {string} scope - e.g. "GET /orders" or "authMiddleware"
 * @param {unknown} err
 * @param {{ ttlMs?: number }} [opts]
 */
function logRouteError(scope, err, opts = {}) {
  const ttlMs = opts.ttlMs ?? 60_000;

  if (isConnectTimeout(err)) {
    if (!throttle('supabase:connect-timeout', ttlMs)) return;
    console.error(
      `[Supabase] connect timeout (while handling ${scope}). Check network, VPN, or DNS. Further identical errors suppressed for ${ttlMs / 1000}s.`
    );
    return;
  }

  console.error(`[${scope}]`, err);
}

/**
 * Node may still print a short TypeError line for some undici rejections; we add one throttled summary line.
 * @param {unknown} reason
 */
function logUnhandledRejection(reason) {
  const err = reason;
  if (isConnectTimeout(err)) {
    if (!throttle('supabase:connect-timeout-unhandled', 60_000)) return;
    console.error(
      '[http] unhandledRejection: Supabase connect timeout (no response reached your machine). Fix network/VPN/DNS; successful calls will show [http] … <-- lines with JSON payloads.'
    );
    return;
  }
  const msg = err instanceof Error ? err.message : String(err);
  const code = err?.cause?.code ?? err?.code;
  if (msg.includes('fetch failed')) {
    if (!throttle('supabase:fetch-failed-unhandled', 30_000)) return;
    console.error('[http] unhandledRejection: fetch failed', code ? `(cause ${code})` : '');
    return;
  }
  console.error('[http] unhandledRejection:', reason);
}

module.exports = { logRouteError, isConnectTimeout, logUnhandledRejection };
