import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';

// Optional: Excel
import * as XLSX from 'xlsx';
// Optional: Supabase (server-side only if you want to store enquiries)
import { createClient } from '@supabase/supabase-js';

const app = express();

// --- Security & parsing ---
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());

// --- Static frontend (put your index.html, css, js inside /public) ---
app.use(express.static('public'));

// --- Rate limit the API to reduce spam ---
const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use('/api/', limiter);

// --- Mail transporter (SMTP) ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// --- Optional: Supabase (only if you want to save submissions) ---
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

// --- Email HTML template with header + footer images ---
function buildEmailHTML(data) {
  // Host these images publicly (CDN, your site, or attach with CID - see below)
  const headerUrl = 'https://your-site.com/email-header.png';
  const footerUrl = 'https://your-site.com/email-footer.png';

  // Basic inlined CSS for better client compatibility
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Enquiry Confirmation</title>
    <style>
      body { margin:0; padding:0; background:#f5f5f5; font-family: Arial, sans-serif; color:#333; }
      .wrap { max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; }
      .header img, .footer img { width:100%; display:block; }
      .body { padding:20px 30px; }
      h2 { margin-top:0; color:#111; }
      p { line-height:1.6; }
      .details { margin:16px 0; padding:12px; background:#fafafa; border-left:4px solid #4CAF50; }
      .signature { margin-top:20px; font-size:14px; color:#555; }
      a { color:#106ebe; text-decoration:none; }
      @media (max-width:600px){ .body { padding:16px 18px; } }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header"><img src="${headerUrl}" alt="TallyTrack Africa"></div>
      <div class="body">
        <h2>Hello ${escapeHTML(data.firstName)} ${escapeHTML(data.lastName)},</h2>
        <p>Thank you for contacting <strong>TallyTrack Africa</strong>. We’ve received your enquiry regarding
          <strong>${escapeHTML(data.enquiryTopic)}</strong>. Our support team will get back to you shortly.</p>

        <div class="details">
          <p><strong>Your Details:</strong></p>
          <p>
            Email: ${escapeHTML(data.email)}<br/>
            Phone: ${escapeHTML(data.phone)}<br/>
          </p>
          <p><strong>Your Message:</strong><br/>${nl2br(escapeHTML(data.message))}</p>
        </div>

        <p>If you have additional information, just reply to this email.</p>

        <div class="signature">
          Best regards,<br/>
          <strong>TallyTrack Africa Support Team</strong><br/>
          <a href="https://tallytrackafrica.com">tallytrackafrica.com</a>
        </div>
      </div>
      <div class="footer"><img src="${footerUrl}" alt=""></div>
    </div>
  </body>
  </html>`;
}

// Text fallback (improves deliverability & accessibility)
function buildEmailText(data) {
  return `Hello ${data.firstName} ${data.lastName},

Thank you for contacting TallyTrack Africa.
We’ve received your enquiry regarding: ${data.enquiryTopic}.

Your details:
- Email: ${data.email}
- Phone: ${data.phone}

Your message:
${data.message}

Best regards,
TallyTrack Africa Support Team
https://tallytrackafrica.co.ke`;
}

// Small helpers to keep HTML safe
function escapeHTML(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function nl2br(str = '') {
  return String(str).replace(/\n/g, '<br/>');
}

// --- Optional: Save to Excel (fast local persistence) ---
function appendToExcel(row) {
  try {
    const filename = process.env.ENQUIRIES_XLSX || 'Asssets/others/enquiries.xlsx';
    let workbook;
    try {
      workbook = XLSX.readFile(filename);
    } catch {
      workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([[
        'created_at', 'enquiryTopic', 'firstName', 'lastName', 'email', 'phone', 'country', 'message'
      ]]);
      XLSX.utils.book_append_sheet(workbook, ws, 'Enquiries');
      XLSX.writeFile(workbook, filename);
      workbook = XLSX.readFile(filename);
    }
    const ws = workbook.Sheets['Enquiries'];
    const toAppend = [{
      created_at: new Date().toISOString(),
      ...row
    }];
    XLSX.utils.sheet_add_json(ws, toAppend, { skipHeader: true, origin: -1 });
    XLSX.writeFile(workbook, filename);
  } catch (e) {
    console.error('Excel write failed:', e);
  }
}

// --- API route: receive enquiries and send emails ---
app.post('/api/enquiry', async (req, res) => {
  try {
    const {
      enquiryTopic = '',
      firstName = '',
      lastName = '',
      email = '',
      phone = '',
      country = '',
      message = '',
    } = req.body || {};

    // Basic validation (server-side)
    if (!enquiryTopic || !firstName || !lastName || !email || !message) {
      return res.status(400).json({ ok: false, error: 'Missing required fields.' });
    }

    // --- Optional: Save to Supabase ---
    if (supabase) {
      const { error } = await supabase.from('enquiries').insert([{
        enquiry_topic: enquiryTopic,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        country,
        message
      }]);
      if (error) console.error('Supabase insert error:', error.message);
    } else {
      // --- Or save to Excel (local file on server) ---
      appendToExcel({ enquiryTopic, firstName, lastName, email, phone, country, message });
    }

    // --- Send confirmation to the user ---
    const userMail = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'We’ve received your enquiry',
      text: buildEmailText({ enquiryTopic, firstName, lastName, email, phone, country, message }),
      html: buildEmailHTML({ enquiryTopic, firstName, lastName, email, phone, country, message }),
      // If you prefer embedding images instead of remote URLs:
       attachments: [
         { filename: 'header.png', path: '/absolute/path/header.png', cid: 'header@cid' },
         { filename: 'footer.png', path: '/absolute/path/footer.png', cid: 'footer@cid' },
      ],
    });

    // --- Notify admin ---
    const adminMail = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New enquiry: ${enquiryTopic} — ${firstName} ${lastName}`,
      text:
`New enquiry received

Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone}
Topic: ${enquiryTopic}

Message:
${message}

Sent at: ${new Date().toISOString()}`,
    });

    return res.json({ ok: true, message: 'Enquiry received and emails sent.' });
  } catch (err) {
    console.error('Email flow error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to process enquiry.' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
});


//
// server.js (ESM)
// Requires: express, dotenv, @supabase/supabase-js, node-fetch
// npm i express dotenv @supabase/supabase-js node-fetch

import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
app.use(express.json());

// ---------- Config from .env ----------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLOUDFLARE_SECRET = process.env.CLOUDFLARE_SECRET_KEY || process.env.cloudflare_secrete_key;

// quick startup checks
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
if (!CLOUDFLARE_SECRET) {
  console.error("Missing CLOUDFLARE_SECRET_KEY in .env");
  process.exit(1);
}

// Create Supabase client using service role key (server-only)
const Supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// ---------- Helper: verify Cloudflare Turnstile token ----------
async function verifyTurnstileToken(token, remoteIp) {
  // Cloudflare expects a POST form
  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

  const params = new URLSearchParams();
  params.append("secret", CLOUDFLARE_SECRET);
  params.append("response", token);
  if (remoteIp) params.append("remoteip", remoteIp);

  const resp = await fetch(url, {
    method: "POST",
    body: params
  });

  const json = await resp.json();
  // Typical Turnstile response has { success: true/false, ... }
  return json;
}

// ---------- Route: record a vote (requires valid Turnstile token) ----------
app.post("/vote", async (req, res) => {
  try {
    const {
      nominee_id,        // uuid of nominee.code (mandatory)
      nominee_code,      // nominee.id text (mandatory in your schema)
      nominee_name,      // name (mandatory)
      voter_phone,       // phone string (mandatory)
      votes_count,       // integer (mandatory)
      amount_theoretical,// integer optional, we'll default below
      user_id,           // optional if logged-in user
      turnstile_token    // token generated in the browser by the Turnstile widget
    } = req.body;

    // Basic validation
    if (!nominee_id || !nominee_code || !nominee_name || !voter_phone || !votes_count) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    if (!turnstile_token) {
      return res.status(400).json({ error: "missing_captcha_token" });
    }

    // verify token with Cloudflare
    const remoteIp = req.ip || req.headers["x-forwarded-for"]?.split(",")[0];
    const verifyResult = await verifyTurnstileToken(turnstile_token, remoteIp);

    if (!verifyResult || !verifyResult.success) {
      // return server-side failure and any details Cloudflare gave
      return res.status(400).json({ error: "captcha_verification_failed", details: verifyResult });
    }

    // compute defaults
    const votesInt = Number(votes_count) || 1;
    const amount = amount_theoretical ? Number(amount_theoretical) : votesInt * 10; // example KES 10/vote

    // Call the stored procedure you created earlier to INSERT into votes and increment nominees.votes atomically
    const rpcPayload = {
      p_nominee_id: nominee_id,
      p_nominee_code: nominee_code,
      p_nominee_name: nominee_name,
      p_user_id: user_id || null,
      p_voter_phone: voter_phone,
      p_votes_count: votesInt,
      p_amount_theoretical: amount,
      p_captcha_token: turnstile_token
    };

    const { data: rpcData, error: rpcError } = await Supabase.rpc("record_vote", rpcPayload);

    if (rpcError) {
      console.error("Supabase RPC error:", rpcError);
      return res.status(500).json({ error: "db_error", details: rpcError });
    }

    // rpcData is usually an array; first row returns vote_id & nominee_votes
    const resultRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    return res.json({
      success: true,
      vote_id: resultRow?.vote_id ?? null,
      nominee_votes: resultRow?.nominee_votes ?? null
    });

  } catch (err) {
    console.error("Server /vote error:", err);
    return res.status(500).json({ error: "internal_server_error", details: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vote server listening on http://localhost:${PORT}`);
});
