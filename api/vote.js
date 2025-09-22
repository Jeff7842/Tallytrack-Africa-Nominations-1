import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const CLOUDFLARE_SECRET = process.env.CLOUDFLARE_SECRET_KEY;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const {
      nominee_id,
      nominee_code,
      nominee_name,
      voter_phone,
      votes_count,
      amount_theoretical,
      user_id,
      turnstile_token,
    } = req.body;

    if (!nominee_id || !nominee_code || !nominee_name || !voter_phone || !votes_count) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    // Verify Cloudflare Turnstile token
    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: CLOUDFLARE_SECRET,
        response: turnstile_token,
      }),
    });
    const verifyResult = await verify.json();

    if (!verifyResult.success) {
      return res.status(400).json({ error: "captcha_verification_failed", details: verifyResult });
    }

    // Insert vote via Supabase RPC
    const rpcPayload = {
      p_nominee_id: nominee_id,
      p_nominee_code: nominee_code,
      p_nominee_name: nominee_name,
      p_user_id: user_id || null,
      p_voter_phone: voter_phone,
      p_votes_count: votes_count,
      p_amount_theoretical: amount_theoretical,
      p_captcha_token: turnstile_token,
    };

    const { data, error } = await supabase.rpc("record_vote", rpcPayload);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "db_error", details: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal_error", details: err.message });
  }
}
