const { createClient } = require('@supabase/supabase-js');
const { Agent, fetch: undiciFetch } = require('undici');

const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Node's global fetch uses undici with a default TCP connect timeout of 10s.
 * Slow or flaky routes to Supabase hit that before any app-level AbortSignal.
 * @see https://github.com/nodejs/undici/blob/main/docs/docs/api/Agent.md
 */
const CONNECT_TIMEOUT_MS = Number(process.env.SUPABASE_CONNECT_TIMEOUT_MS || 45000);
const HEADERS_TIMEOUT_MS = Number(process.env.SUPABASE_HEADERS_TIMEOUT_MS || 120000);
const BODY_TIMEOUT_MS = Number(process.env.SUPABASE_BODY_TIMEOUT_MS || 120000);

/** Overall ceiling for the whole request (after connect). */
const FETCH_TIMEOUT_MS = Number(
  process.env.SUPABASE_FETCH_TIMEOUT_MS || Math.max(CONNECT_TIMEOUT_MS + 15_000, 60_000)
);

const supabaseDispatcher = new Agent({
  connectTimeout: CONNECT_TIMEOUT_MS,
  headersTimeout: HEADERS_TIMEOUT_MS,
  bodyTimeout: BODY_TIMEOUT_MS,
});

/**
 * Fetch for Supabase: undici Agent (longer connect) + AbortSignal ceiling.
 */
function supabaseFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const parentSignal = options.signal;
  if (parentSignal) {
    if (parentSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      parentSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  const { signal: _parentSig, dispatcher: _disp, ...rest } = options;
  return undiciFetch(url, {
    ...rest,
    signal: controller.signal,
    dispatcher: supabaseDispatcher,
  }).finally(() => clearTimeout(timeoutId));
}

// Service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: supabaseFetch,
  },
});

// Create a client for user operations (using anon key if available)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || supabaseServiceKey;
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: supabaseFetch,
  },
});

module.exports = { supabase, supabaseAdmin };
