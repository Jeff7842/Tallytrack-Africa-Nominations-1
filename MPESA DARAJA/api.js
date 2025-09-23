// api.js (replace/extend your existing api.js with the following)
require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const moment = require('moment');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  fetch
});

const M_PESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const M_PESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const M_PESA_SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const M_PESA_PASSKEY = process.env.MPESA_PASSKEY;
const M_PESA_ENV = process.env.MPESA_ENV || 'sandbox';
const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL; // must be https in prod
const TURNSTILE_SECRET = process.env.cloudflare_secrete_key|| '';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const PAYBILL_LABEL = process.env.PAYBILL_LABEL || 'Tallytrack Africa Under 40 Awards';

// Enable simple CORS for frontend origin (tighten for production)
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

async function getAccessToken() {
  if (!M_PESA_CONSUMER_KEY || !M_PESA_CONSUMER_SECRET) {
    throw new Error('Missing M-Pesa consumer credentials');
  }

  const url =
    M_PESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const auth = "Basic " + Buffer.from(M_PESA_CONSUMER_KEY + ":" + M_PESA_CONSUMER_SECRET).toString('base64');

  const response = await axios.get(url, { headers: { Authorization: auth } });
  return response.data.access_token;
}

// server-side Turnstile validation (optional)
async function verifyTurnstile(token, remoteip) {
  if (!TURNSTILE_SECRET || !token) return { success: true }; // skip if not configured
  try {
    const resp = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', null, {
      params: { secret: TURNSTILE_SECRET, response: token, remoteip },
    });
    return resp.data;
  } catch (err) {
    console.error('Turnstile verification error', err?.response?.data || err);
    return { success: false };
  }
}

// POST /api/submit-vote
// body: { nominee_id, voter_phone, votes_count, captchaToken }
router.post('/api/submit-vote', async (req, res) => {
  try {
    const { nominee_id, voter_phone, votes_count = 1, captchaToken } = req.body;

    // basic validation
    if (!nominee_id || !voter_phone || !votes_count) {
      return res.status(400).json({ error: 'Missing nominee_id, voter_phone or votes_count' });
    }

    // normalize phone to 2547XXXXXXXX
    let phone = String(voter_phone).trim();
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (!/^2547\d{8}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format. Use 07XXXXXXXX or 2547XXXXXXXX' });
    }

    // Verify captcha server-side (if enabled)
    const verification = await verifyTurnstile(captchaToken, req.ip);
    if (!verification.success) {
      return res.status(403).json({ error: 'Captcha validation failed' });
    }

    // Look up nominee in supabase to get nominee.code and name
    const { data: nominee, error: nomineeError } = await supabase
      .from('nominees')
      .select('code, id, name, votes')
      .eq('id', nominee_id)
      .single();

    if (nomineeError || !nominee) {
      console.error('Nominee lookup error', nomineeError);
      return res.status(404).json({ error: 'Nominee not found' });
    }

    const votePrice = 10; // keep same price model as frontend
    const amount = Number(votes_count) * votePrice;

    // Insert pending vote record
    const insertPayload = {
      nominee_code: nominee.code,
      id: nominee.id,                  // matches your SQL 'id' FK
      nominee_name: nominee.name,
      voter_phone: phone,
      votes_count: Number(votes_count),
      amount_theoretical: amount,
      status: 'pending',
      captcha_token: captchaToken || null,
      created_at: new Date().toISOString()
    };

    const { data: insertedRows, error: insertError } = await supabase
      .from('votes')
      .insert([insertPayload])
      .select()
      .single();

    if (insertError || !insertedRows) {
      console.error('Failed to create vote record', insertError);
      return res.status(500).json({ error: 'Failed to create vote record' });
    }

    const voteRow = insertedRows;

    // Initiate STK Push to Safaricom
    const accessToken = await getAccessToken();
    const url = M_PESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(M_PESA_SHORTCODE + M_PESA_PASSKEY + timestamp).toString('base64');

    // Use AccountReference to carry nominee.id (as requested) and TransactionDesc for custom display
    const accountReference = String(nominee.id).slice(0, 20); // keep short if needed by paybill
    const transactionDesc = `${PAYBILL_LABEL} ${String(nominee.id).slice(0, 12)}`;

    // Callback URL must be reachable by Safaricom; include nothing sensitive in query
    const callbackUrl = `${CALLBACK_BASE_URL}/api/callback`;

    const payload = {
      BusinessShortCode: M_PESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: M_PESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc
    };

    const stkResp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
    });

    // Safaricom returns MerchantRequestID and CheckoutRequestID
    const stkData = stkResp.data;
    const checkoutRequestID = stkData?.CheckoutRequestID || (stkData?.ResponseMetadata && stkData.ResponseMetadata.CheckoutRequestID) || null;

    // Update vote record with checkoutRequestID for mapping
    await supabase
      .from('votes')
      .update({ checkout_request_id: checkoutRequestID, updated_at: new Date().toISOString() })
      .eq('code', voteRow.code);

    // Return success + metadata to client
    return res.status(200).json({
      status: true,
      msg: 'STK Push initiated. You should receive an M-Pesa prompt on your phone.',
      merchantResponse: stkData,
      checkoutRequestID,
      vote_code: voteRow.code
    });

  } catch (err) {
    console.error('submit-vote error', err?.response?.data || err.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// STK PUSH CALLBACK
router.post('/api/callback', async (req, res) => {
  try {
    // Write incoming callback for debugging (optional)
    try {
      fs.writeFileSync('last_stk_callback.json', JSON.stringify(req.body, null, 2), 'utf8');
    } catch (e) { /* ignore */ }

    // Safaricom callback wrapper location depends on their payload shape:
    const callbackBody = req.body?.Body?.stkCallback || req.body?.Body?.stkCallback || req.body?.Body?.stkCallback || req.body?.Body?.stkCallback;
    // try various paths more defensively:
    let stkCallback = req.body?.Body?.stkCallback || null;
    if (!stkCallback && req.body?.Body && req.body.Body.stkCallback) stkCallback = req.body.Body.stkCallback;

    if (!stkCallback) {
      // If weird payload shape, try to find known fields
      if (req.body?.Body && req.body.Body.stkCallback) stkCallback = req.body.Body.stkCallback;
    }

    // If still null, accept generic structure fallback
    if (!stkCallback) {
      // Store full body as raw_callback and exit gracefully
      console.warn('Callback format unknown, storing raw body');
      return res.status(200).json({ status: 'ignored', reason: 'unknown format' });
    }

    const merchantRequestID = stkCallback.MerchantRequestID;
    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    // If successful (ResultCode == 0) parse CallbackMetadata for amounts, receipt
    let amount = null, mpesaReceiptNumber = null, transactionDate = null, phone = null;

    if (stkCallback && stkCallback.CallbackMetadata && Array.isArray(stkCallback.CallbackMetadata.Item)) {
      for (const item of stkCallback.CallbackMetadata.Item) {
        const n = item.Name || item.name || '';
        if (/Amount/i.test(n)) amount = item.Value;
        if (/MpesaReceiptNumber/i.test(n)) mpesaReceiptNumber = item.Value;
        if (/TransactionDate/i.test(n)) transactionDate = item.Value;
        if (/PhoneNumber/i.test(n)) phone = item.Value;
      }
    }

    // Find vote record by checkoutRequestID
    const { data: voteRows, error: voteErr } = await supabase
      .from('votes')
      .select('*')
      .eq('checkout_request_id', checkoutRequestID)
      .maybeSingle();

    if (voteErr) {
      console.error('Error fetching vote for callback', voteErr);
      // still respond 200 so Safaricom won't retry indefinitely
      return res.status(200).json({ status: 'ok' });
    }

    const vote = voteRows;

    if (!vote) {
      console.warn('No vote row matched checkoutRequestID', checkoutRequestID);
      return res.status(200).json({ status: 'no-match' });
    }

    // Update vote row depending on resultCode
    const newStatus = resultCode === 0 ? 'completed' : (resultCode === 1032 || resultCode === 1) ? 'failed' : 'failed';

    await supabase
      .from('votes')
      .update({
        status: newStatus,
        amount_received: amount,
        mpesa_receipt_number: mpesaReceiptNumber,
        raw_callback: req.body,
        updated_at: new Date().toISOString()
      })
      .eq('code', vote.code);

    // If payment successful, increment nominee votes counter
    if (newStatus === 'completed') {
      // read current votes
      const nomineeId = vote.id;
      const { data: nom, error: nomErr } = await supabase
        .from('nominees')
        .select('votes')
        .eq('id', nomineeId)
        .single();

      if (!nomErr && nom) {
        const newVotes = (nom.votes || 0) + (vote.votes_count || 0);
        await supabase
          .from('nominees')
          .update({ votes: newVotes, updated_at: new Date().toISOString() })
          .eq('id', nomineeId);
      } else {
        console.error('Failed to update nominee votes', nomErr);
      }
    }

    // reply 200 to safaricom
    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error('callback processing error', err);
    return res.status(200).json({ status: 'error' }); // respond 200 to avoid retries
  }
});

module.exports = router;
