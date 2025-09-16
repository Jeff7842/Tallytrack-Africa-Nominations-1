import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

// Google reCAPTCHA secret key (from your reCAPTCHA v3 settings)
const RECAPTCHA_SECRET = Deno.env.get("RECAPTCHA_SECRET")

serve(async (req) => {
  try {
    const { captchaToken, nominee_id, voter_phone, votes_count } = await req.json()

    if (!captchaToken) {
      return new Response(JSON.stringify({ error: "Missing captcha token" }), { status: 400 })
    }

    // 🔐 Verify with Google
    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${RECAPTCHA_SECRET}&response=${captchaToken}`
    })

    const verifyData = await verifyRes.json()
    console.log("reCAPTCHA verify response:", verifyData)

    if (!verifyData.success || verifyData.score < 0.5) {
      return new Response(JSON.stringify({ error: "Captcha failed" }), { status: 403 })
    }

    // ✅ Captcha passed → insert into Supabase votes table
    
    const supabaseUrl = Deno.env.get("https://cijjwarijqkaihehjskw.supabase.co")
    const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
    const supabaseKey = Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpamp3YXJpanFrYWloZWhqc2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzAxODQsImV4cCI6MjA3MjAwNjE4NH0.h0VWs07u1mPGCBKc7wcOAG_ejH8LK8CdyFFHVyoILp8") // must use service key
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from("votes")
      .insert([
        {
          nominee_id,
          voter_phone,
          votes_count,
          amount_theoretical: votes_count * 10,
          status: "completed",
          captcha_token: captchaToken
        }
      ])

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 })

  } catch (err) {
    console.error("Server error:", err)
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 })
  }
})
