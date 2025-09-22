// index.js - Railway-ready small server
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(helmet());
app.use(express.json());

// Allow only your frontend origin in production (set FRONTEND_ORIGIN env)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ origin: FRONTEND_ORIGIN }));

// Basic rate limit to protect endpoints from abuse
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 }); // 60 req/min per IP
app.use('/verify-turnstile', limiter);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLOUDFLARE_SECRET = process.env.CLOUDFLARE_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CLOUDFLARE_SECRET) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CLOUDFLARE_SECRET');
  process.exit(1);
}

// Supabase server client (service role) — **only on server**
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper: verify token with Cloudflare Turnstile
async function verifyTurnstileToken(token, remoteip) {
  const body = new URLSearchParams();
  body.append('secret', CLOUDFLARE_SECRET);
  body.append('response', token);
  if (remoteip) body.append('remoteip', remoteip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body
  });
  const json = await res.json();
  return json; // returns { success: true|false, ... }
}

// Endpoint: just verify the token (used to enable the button)
app.post('/verify-turnstile', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token required' });

    const result = await verifyTurnstileToken(token, req.ip);
    if (result.success) return res.json({ success: true });
    return res.status(400).json({ success: false, errors: result['error-codes'] || [] });
  } catch (err) {
    console.error('verify-turnstile error', err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Endpoint: create a vote record (saves captcha_token). Later you'll update status when MPESA confirms.
app.post('/submit-vote', async (req, res) => {
  try {
    const { token, nominee_id, voter_phone, votes_count } = req.body;
    if (!token || !nominee_id || !voter_phone || !votes_count) {
      return res.status(400).json({ error: 'missing parameters' });
    }

    // 1) re-verify token (defense-in-depth)
    const verification = await verifyTurnstileToken(token, req.ip);
    if (!verification.success) {
      return res.status(400).json({ error: 'captcha verification failed' });
    }

    const amount_theoretical = Number(votes_count) * 10; // KES 10 per vote

    // 2) Insert into Supabase using service role key (server-side)
    const { data, error } = await supabase
      .from('votes')
      .insert([{
        nominee_id,
        voter_phone,
        votes_count: Number(votes_count),
        amount_theoretical,
        status: 'pending',       // update to 'completed' on successful payment callback
        captcha_token: token
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error', error);
      return res.status(500).json({ error: 'db insert failed' });
    }

    // Return created vote record (including id) to the frontend
    return res.json({ success: true, vote: data });
  } catch (err) {
    console.error('submit-vote error', err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
