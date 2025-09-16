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
