// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fetch = require('node-fetch'); // if you run Node 18+ you can use global fetch
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
app.use(cors());
app.use(express.json());

// Required env vars (example below)
const {
  R2_ACCOUNT_ID,
  R2_BUCKET,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  WEB3FORMS_ACCESS_KEY, // used server-side to send email through Web3Forms
  PORT = 5000
} = process.env;

// Create S3-compatible client for R2
const s3 = new S3Client({
  region: 'auto', // works for R2 with the S3-compatible endpoint
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, // NB: account id domain
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

// 1) presign endpoint — give client a PUT url and a pre-signed GET (download) url
app.post('/presign', async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });

    const safeName = filename.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');
    const key = `applicant-images/${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeName}`;

    // presigned PUT (upload) — short expiry (example 1 hour)
    const putCmd = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 * 60 });

    // presigned GET (download) — longer expiry so link in email remains valid (example 7 days)
    const getCmd = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });
    const downloadUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 * 60 * 24 * 7 });

    return res.json({ uploadUrl, downloadUrl, key });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed to create presigned urls' });
  }
});

// 2) notify endpoint — server posts to Web3Forms to send the email (keeps the access_key secret)
app.post('/notify', async (req, res) => {
  try {
    const { name, email, extraMessage, fileUrl } = req.body;
    if (!fileUrl || !name) return res.status(400).json({ error: 'name and fileUrl required' });

    // Build payload for Web3Forms
    const payload = {
      access_key: '1612f587-666d-4c7d-9e3d-7dc85329557d',
      name,
      email: email || '',         // optional: will be used as reply-to if provided
      subject: 'New nominee image uploaded',
      message: `${extraMessage || 'A new photo was uploaded.'}\n\nImage link: ${fileUrl}`,
      replyto: email || undefined,
    };

    const r = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    return res.json({ success: true, web3forms: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed to notify' });
  }
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
