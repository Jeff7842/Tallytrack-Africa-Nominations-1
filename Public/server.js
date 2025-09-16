app.post("/verify", async (req, res) => {
  const token = req.body["h-captcha-response"];
  const secret = "ES_2ccaf8d88af4428badf19a4689da4680";

  const verifyRes = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token })
  });

  const data = await verifyRes.json();

  if (data.success) {
    res.json({ success: true, message: "hCaptcha passed" });
  } else {
    res.status(400).json({ success: false, message: "hCaptcha failed", details: data });
  }
});
