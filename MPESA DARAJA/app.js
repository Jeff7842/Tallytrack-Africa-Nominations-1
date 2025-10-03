/*
  Author: Alvin Kiveu
  Description: Mpesa Daraja API with Node JS
  Date: 23/10/2023
  Github Link: https://github.com/alvin-kiveu/Mpesa-Daraja-Api-NODE.JS.git
  Website: www.umeskiasoftwares.com
  Email: info@umeskiasoftwares.com
  Phone: +254113015674
*/
require('dotenv').config();
const express = require("express");
const app = express();
const http = require("http");
const bodyParser = require("body-parser");
const axios = require("axios"); // Import 'axios' instead of 'request'
const moment = require("moment");
const apiRouter = require('./api'); 
const cors = require("cors");
const fs = require("fs");
const server = http.createServer(app);
const port =5000;
const hostname = "localhost";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use('/', apiRouter);

const path = require('path');
const PAYMENTS_FILE = path.join(__dirname, 'payments.json');

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase env vars missing. DB writes will fail.');
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);


function readPayments() {
  try {
    if (!fs.existsSync(PAYMENTS_FILE)) return {};
    return JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8') || '{}');
  } catch (e) { return {}; }
}
function writePayments(obj) {
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(obj, null, 2), 'utf8');
}


// ACCESS TOKEN FUNCTION - Updated to use 'axios'
async function getAccessToken() {
  const consumer_key = "8XJW8SOeGGwrAOpswERQXoNvGriJ2lYAGpbhIO9zDI3jZ1ck"; // REPLACE IT WITH YOUR CONSUMER KEY
  const consumer_secret = "Xy2pXRvklqGqHEU3WNh19RTND31tjNkaI1QlC08XQAXOo3LYL0yM2JyoREtWSRms"; // REPLACE IT WITH YOUR CONSUMER SECRET
  const url =
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const auth =
    "Basic " +
    new Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: auth,
      },
    });
   
    const dataresponse = response.data;
    // console.log(data);
    const accessToken = dataresponse.access_token;
    return accessToken;
  } catch (error) {
    throw error;
  }
}




//ACCESS TOKEN ROUTE
app.get("/access_token", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      res.send("😀 Your access token is " + accessToken);
    })
    .catch(console.log);
});

//MPESA STK PUSH ROUTE
// helper to normalize phone
function normalizePhone(phone) {
  phone = String(phone || '').trim();
  if (!phone) return null;
  // allow 07XXXXXXXX or 2547XXXXXXXX
  if (/^07\d{8}$/.test(phone)) return '254' + phone.slice(1);
  if (/^2547\d{8}$/.test(phone)) return phone;
  // attempt to strip spaces and + sign
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 12 && digits.startsWith('254')) return digits;
  return null;
}

// POST /stkpush
// Replace your current /stkpush route with this POST handler
app.post('/stkpush', async (req, res) => {
  try {
    const { phone, amount, nominee_id, nominee_name } = req.body;
    const accountReference = nominee_id || nominee_name || 'Vote';
    // validate
    if (!phone || !/^(07\d{8}|2547\d{8})$/.test(String(phone))) {
      return res.status(400).json({ success:false, error: 'Invalid phone format. Use 07XXXXXXXX or 2547XXXXXXXX' });
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success:false, error: 'Invalid amount' });
    }

    const accessToken = await getAccessToken(); // your existing function
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const BusinessShortCode = process.env.BUSINESS_SHORTCODE || '174379';
    const LIPA_PASSKEY = process.env.LIPA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

    const password = Buffer.from(BusinessShortCode + LIPA_PASSKEY + timestamp).toString('base64');

    // ensure callback is a public https url that Safaricom can call
    const callbackBase = process.env.PUBLIC_CALLBACK_URL || 'https://subintestinal-sheryll-waggly.ngrok-free.dev';
    const requestBody = {
      BusinessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: '1',//Number(amount)
      PartyA: phone.startsWith('07') ? '254' + phone.slice(1) : phone, // normalize
      PartyB: BusinessShortCode,
      PhoneNumber: phone.startsWith('07') ? '254' + phone.slice(1) : phone,
      CallBackURL: callbackBase.replace(/\/$/, '') + "/callback",
      AccountReference: accountReference,
      TransactionDesc: `Vote for ${nominee_name || nominee_id}`
    };

    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const auth = "Bearer " + accessToken;
    const mpesaResp = await axios.post(url, requestBody, { headers: { Authorization: auth } });

    // extract identifiers Safaricom returns
    const respData = mpesaResp.data || {};
    const checkoutRequestID = respData.CheckoutRequestID || respData.CheckoutRequestID || `cr_${Date.now()}`;
    const merchantRequestID = respData.MerchantRequestID || null;

    // persist a pending record so callback can update it
    const payments = readPayments();
    payments[checkoutRequestID] ={
  phone,
  amount,
  nominee_id: req.body.nominee_id,
  nominee_code: req.body.nominee_code,
  nominee_name: req.body.nominee_name,
  status: 'pending'
};
writePayments(payments); // after you wrote payments[checkoutRequestID] = {...}


await supabase
  .from('votes')
  .insert([{
    nominee_code: req.body.nominee_code,   // pass this from frontend
    id: req.body.nominee_id,              // foreign key to nominees
    nominee_name: req.body.nominee_name,  // optional for easy reporting
    voter_phone: phone,
    votes_count: Number(amount) / 1,     // if 10 shillings = 1 vote
    amount_theoretical: Number(amount),
    checkout_request_id: checkoutRequestID,
    status: 'pending',
    //captcha_token: req.body.captchaToken
  }]);

    // return checkout id to frontend so it can poll
    return res.json({ success: true, checkoutRequestID, merchantRequestID, raw: respData });
  } catch (err) {
    console.error('stkpush error ->', err.response?.data || err.message || err);
    const msg = err.response?.data || err.message || 'Internal error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// Add a simple GET /payment-status route that the frontend will poll
// Example: /payment-status?checkoutRequestId=<id>
app.get('/payment-status', (req, res) => {
  const id = req.query.checkoutRequestId;
  if (!id) return res.status(400).json({ success:false, error: 'checkoutRequestId required' });

  const payments = readPayments();
  const rec = payments[id];
  if (!rec) return res.status(404).json({ success:false, error: 'Not found' });
  return res.json({ success:true, data: rec });
});

//STK PUSH CALLBACK ROUTE
app.post('/callback', async (req, res) => {
  // Acknowledge immediately so Safaricom won't retry due to timeout
  res.status(200).send('OK');

  try {
    const body = req.body || {};
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      console.warn('Callback received without stkCallback object — saving raw body for inspection.');
      fs.writeFileSync(path.join(__dirname, 'stkcallback.json'), JSON.stringify(body, null, 2), 'utf8');
      return;
    }

    // Extract core fields
    const { CheckoutRequestID, MerchantRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
    console.log('STK callback received for', CheckoutRequestID || MerchantRequestID, 'ResultCode=', ResultCode);

    // Load local payments backup
    const payments = readPayments();

    // Try to find matching payments.json key (by CheckoutRequestID, then MerchantRequestID)
    let key = CheckoutRequestID;
    if (!key || !payments[key]) {
      if (MerchantRequestID) {
        const found = Object.keys(payments).find(k => payments[k]?.merchantRequestID === MerchantRequestID);
        if (found) key = found;
      }
    }

    // Create/clone record object (define it before using)
    let record = payments[key] ? { ...payments[key] } : { merchantRequestID: MerchantRequestID, checkoutRequestID: CheckoutRequestID };

    // Extract CallbackMetadata items safely
    let mpesaReceipt = null;
    let amountReceived = null;
    let payerPhone = null;
    if (CallbackMetadata && Array.isArray(CallbackMetadata.Item)) {
      for (const it of CallbackMetadata.Item) {
        const name = String(it.Name || '').toLowerCase();
        if (name.includes('receipt')) mpesaReceipt = it.Value;
        if (name === 'amount' || name.includes('amount')) amountReceived = it.Value;
        if (name.includes('phone')) payerPhone = it.Value;
      }
    }

    // Build record fields (now defined)
    record.merchantRequestID = MerchantRequestID || record.merchantRequestID || null;
    record.checkoutRequestID = CheckoutRequestID || record.checkoutRequestID || key || null;
    record.rawInitResponse = record.rawInitResponse || null;
    record.phone = payerPhone || record.phone || record.voter_phone || record.phone || null;
    record.amount = record.amount || record.amount_theoretical || null;
    record.lastCallback = {
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      receivedAt: new Date().toISOString(),
      raw: stkCallback
    };

    record.mpesa_receipt_number = mpesaReceipt || record.mpesa_receipt_number || null;
    record.amount_received = amountReceived ? Number(amountReceived) : (record.amount_received || null);
    record.status = (Number(ResultCode) === 0) ? 'completed' : 'failed';
    record.processedAt = new Date().toISOString();

    // Persist to local payments.json backup (optional but useful)
    if (key) payments[key] = record;
    writePayments(payments);

    // Write raw callback JSON for debugging
    fs.writeFileSync(path.join(__dirname, 'stkcallback.json'), JSON.stringify(body, null, 2), 'utf8');

    // Update Supabase (only if client initialized)
    if (typeof supabase !== 'undefined') {
      // Update the votes row with callback data
      const updatePayload = {
        status: record.status,
        amount_received: record.amount_received,
        mpesa_receipt_number: record.mpesa_receipt_number,
        raw_callback: record.lastCallback,
        updated_at: new Date().toISOString()
      };

      const { error: updateErr } = await supabase
        .from('votes')
        .update(updatePayload)
        .eq('checkout_request_id', CheckoutRequestID);

      if (updateErr) {
        console.error('Supabase update error for checkout', CheckoutRequestID, updateErr);
      } else {
        console.log('Updated votes table for checkout', CheckoutRequestID);
      }

      // If completed, increment nominee votes (try RPC then fallback)
      if (record.status === 'completed') {
        const nomineeId = record.id || record.nominee_id || record.nomineeCode || record.nominee_code || null;
        let incrementBy = record.votes_count || null;
        // fallback to compute votes from amount: e.g. 10 KES per vote
        if ((!incrementBy || incrementBy === 0) && record.amount_received) {
          incrementBy = Math.floor(Number(record.amount_received) / 10);
        }
        if (nomineeId && incrementBy > 0) {
          const { error: rpcErr } = await supabase.rpc('increment_votes', { nominee_id: nomineeId, increment_by: incrementBy });
          if (rpcErr) {
            console.error('RPC increment_votes failed, falling back to read/then-update', rpcErr);
            // fallback
            try {
              const { data: ndata, error: nf } = await supabase.from('nominees').select('votes').eq('id', nomineeId).single();
              if (!nf) {
                const newVotes = (ndata.votes || 0) + incrementBy;
                await supabase.from('nominees').update({ votes: newVotes, updated_at: new Date().toISOString() }).eq('id', nomineeId);
                console.log('Nominee votes updated by fallback for', nomineeId, '+=', incrementBy);
              } else console.error('Failed to read nominee for fallback update', nf);
            } catch (fallbackErr) {
              console.error('Fallback nominee update error', fallbackErr);
            }
          } else {
            console.log('increment_votes RPC succeeded for', nomineeId, 'by', incrementBy);
          }
        } else {
          console.warn('Could not determine nomineeId or incrementBy; skipping nominee increment.', nomineeId, incrementBy);
        }
      } // end completed handling
    } else {
      console.warn('Supabase not initialized; skipping DB updates for callback', CheckoutRequestID);
    }

    console.log('STK callback processed for', record.checkoutRequestID || CheckoutRequestID, 'status', record.status);
  } catch (err) {
    console.error('Unhandled error in /callback handler:', err);
  }
});



// Serve frontend
app.use(express.static(path.join(__dirname, '../Public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Public', 'dashboard.html'));
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


