// verify-vote.js  -- Cloudflare Worker (module syntax)
// Deploy with Wrangler or Pages Functions; set the environment secrets listed below.

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstile(token, remoteIp, cloudflare_secrete_key) {
  if (!token) return { success: false, error: "missing_turnstile_token" };

  const form = new URLSearchParams();
  form.set("secret", cloudflare_secrete_key);
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    return { success: false, error: "turnstile_verify_failed", status: res.status };
  }
  const data = await res.json();
  return data; // { success: true/false, ... }
}

// Helper to call Supabase REST (PostgREST) API
async function supabaseInsertVote(supabaseUrl, serviceRoleKey, votePayload) {
  const url = `${supabaseUrl}/rest/v1/votes`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      // tell PostgREST we want representation of the inserted row
      "Prefer": "return=representation"
    },
    body: JSON.stringify(votePayload),
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = text; }
  return { ok: res.ok, status: res.status, body: json };
}

async function supabaseUpdateNomineeVotes(supabaseUrl, serviceRoleKey, nomineeId, delta) {
  // increments votes by delta using PostgREST PATCH
  const url = `${supabaseUrl}/rest/v1/nominees?id=eq.${encodeURIComponent(nomineeId)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({ votes: `votes + ${Number(delta)}` })
  });

  // Fallback: If server doesn't accept SQL expression in PATCH body,
  // do safe read + update. We'll attempt a SQL RPC style below if PATCH fails.
  if (res.ok) {
    const body = await res.json().catch(()=>null);
    return { ok: true, body };
  }

  // Try read -> update fallback (two requests)
  // read current votes
  const readUrl = `${supabaseUrl}/rest/v1/nominees?id=eq.${encodeURIComponent(nomineeId)}&select=votes`;
  const r = await fetch(readUrl, {
    headers: { "apikey": serviceRoleKey, "Authorization": `Bearer ${serviceRoleKey}` }
  });

  if (!r.ok) return { ok: false, status: r.status };

  const arr = await r.json();
  const current = Array.isArray(arr) && arr[0] ? Number(arr[0].votes || 0) : 0;
  const updated = current + Number(delta);

  const up = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({ votes: updated })
  });

  const updBody = await up.json().catch(()=>null);
  return { ok: up.ok, status: up.status, body: updBody };
}

// The Worker entrypoint
export default {
  async fetch(request, env, ctx) {
    // Only accept POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { "Content-Type": "application/json" }});
    }

    const SUPABASE_URL = env.VITE_SUPABASE_URL; // e.g. "https://yourproject.supabase.co"
    const VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY; // store as secret
    const cloudflare_secrete_key = env.cloudflare_secrete_key; // store as secret

    // Basic presence checks for secrets
    if (!SUPABASE_URL || !VITE_SUPABASE_ANON_KEY || !cloudflare_secrete_key) {
      return new Response(JSON.stringify({ error: "server_misconfigured" }), { status: 500, headers: { "Content-Type": "application/json" }});
    }

    // Parse incoming JSON
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    // Expected fields from your client: captchaToken, nominee_id, voter_phone, votes_count
    const { captchaToken, nominee_id, voter_phone, votes_count } = body;

    // Validate basic shape
    if (!nominee_id || !voter_phone || !votes_count) {
      return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    // Validate phone basic pattern (allow 07XXXXXXXX or 2547XXXXXXXX)
    const phone = String(voter_phone).trim();
    if (!/^(?:07\d{8}|2547\d{8})$/.test(phone)) {
      return new Response(JSON.stringify({ error: "invalid_phone" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    // Validate votes_count integer >=1
    const votes = Number(votes_count);
    if (!Number.isInteger(votes) || votes < 1) {
      return new Response(JSON.stringify({ error: "invalid_votes_count" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    // Verify Turnstile
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for");
    const verifyRes = await verifyTurnstile(captchaToken, ip, cloudflare_secrete_key);
    if (!verifyRes || !verifyRes.success) {
      return new Response(JSON.stringify({ error: "captcha_failed", details: verifyRes }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    // Build vote payload for your 'votes' table
    const votePayload = {
      nominee_id: nominee_id,
      phone_number: phone,
      votes_count: votes,
      amount_paid: votes * 10, // your client uses 10 KES per vote
      status: "completed",
      captcha_token: captchaToken,
      created_at: new Date().toISOString()
    };

    // Insert vote row
    const insert = await supabaseInsertVote(SUPABASE_URL, VITE_SUPABASE_ANON_KEY, votePayload);
    if (!insert.ok) {
      return new Response(JSON.stringify({ error: "db_insert_failed", details: insert }), { status: 500, headers: { "Content-Type": "application/json" }});
    }

    // Update nominee votes (add the votes)
    const updateNom = await supabaseUpdateNomineeVotes(SUPABASE_URL, VITE_SUPABASE_ANON_KEY, nominee_id, votes);
    if (!updateNom.ok) {
      // Not a fatal user error: log and return success for vote creation but warn client
      return new Response(JSON.stringify({ ok: true, warning: "vote_recorded_nominee_update_failed", details: updateNom }), { status: 200, headers: { "Content-Type": "application/json" }});
    }

    // Success response
    return new Response(JSON.stringify({ ok: true, vote: insert.body, nominee: updateNom.body }), { status: 200, headers: { "Content-Type": "application/json" }});
  }
};
