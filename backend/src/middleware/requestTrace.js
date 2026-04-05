const { randomBytes } = require('crypto');

function traceEnabled() {
  if (process.env.NODE_ENV === 'test') return false;
  return process.env.REQUEST_TRACE !== '0';
}

/**
 * Redact secrets from logged request bodies.
 * @param {string} path
 * @param {unknown} body
 */
function sanitizeBody(path, body) {
  if (body === null || body === undefined) return body;
  if (typeof body !== 'object' || Array.isArray(body)) return body;
  const out = { ...body };
  if (typeof out.password === 'string') out.password = '***';
  if (typeof out.refresh_token === 'string') out.refresh_token = '***';
  if (typeof out.access_token === 'string') out.access_token = '***';
  return out;
}

function preview(value, maxLen = 700) {
  if (value === undefined) return '';
  try {
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    if (s.length <= maxLen) return s;
    return `${s.slice(0, maxLen)}…(+${s.length - maxLen} chars)`;
  } catch {
    return '[unserializable]';
  }
}

/**
 * Logs every request/response when enabled (default: on; off in test; REQUEST_TRACE=0 to disable).
 * Shows method, path, query, sanitized JSON body, duration, status, optional user id, response JSON preview.
 */
function requestTrace(req, res, next) {
  if (!traceEnabled()) {
    return next();
  }

  const id = randomBytes(4).toString('hex');
  req.traceId = id;
  const started = Date.now();
  const pathOnly = (req.originalUrl || req.url || '').split('?')[0];

  const queryKeys = req.query && typeof req.query === 'object' ? Object.keys(req.query) : [];
  const queryPart =
    queryKeys.length > 0 ? ` query=${preview(req.query, 220)}` : '';

  let bodyPart = '';
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const safe = sanitizeBody(pathOnly, req.body);
    if (safe !== undefined && safe !== null && !(typeof safe === 'object' && Object.keys(safe).length === 0)) {
      bodyPart = ` body=${preview(safe, 500)}`;
    }
  }

  const authPart = req.headers.authorization ? ' auth=Bearer ***' : '';

  console.log(`[http] ${id} --> ${req.method} ${pathOnly}${queryPart}${bodyPart}${authPart}`);

  const origJson = res.json.bind(res);
  res.json = function tracedJson(payload) {
    const code = res.statusCode || 200;
    const ms = Date.now() - started;
    const uid =
      req.user && req.user.id
        ? ` user=${req.user.id.slice(0, 8)}…`
        : '';
    console.log(`[http] ${id} <-- ${code} ${ms}ms${uid} ${preview(payload, 900)}`);
    return origJson(payload);
  };

  next();
}

module.exports = { requestTrace, traceEnabled };
