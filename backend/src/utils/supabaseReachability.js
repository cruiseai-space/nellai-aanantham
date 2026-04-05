/**
 * When Node cannot open a TCP connection to Supabase (undici), the client often surfaces
 * `{ message: 'fetch failed' }` — that must not be treated as invalid credentials (401).
 * @param {unknown} e — GoTrue AuthError, thrown Error, or similar
 */
function isSupabaseUnreachableError(e) {
  if (e == null || typeof e !== 'object') return false;
  const msg = String('message' in e ? e.message : '');
  const cause = 'cause' in e ? e.cause : null;
  const code =
    (cause && typeof cause === 'object' && 'code' in cause && cause.code) ||
    ('code' in e ? e.code : undefined);

  if (code === 'UND_ERR_CONNECT_TIMEOUT') return true;
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ECONNREFUSED') return true;
  if (msg === 'fetch failed') return true;
  if (/connect timeout|connection.*refused|network.*unreachable/i.test(msg)) return true;
  return false;
}

const UNAVAILABLE_MESSAGE =
  'Cannot reach Supabase from this server (network timeout or blocked path). Check VPN, firewall, DNS, or try another network. The API URL in .env must match your project.';

module.exports = { isSupabaseUnreachableError, UNAVAILABLE_MESSAGE };
