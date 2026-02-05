export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  try {
    const gas = process.env.GAS_WEBAPP_URL;
    if (!gas) return res.status(500).json({ ok: false, message: "Missing GAS_WEBAPP_URL env var" });

    const payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (!payload?.date || !payload?.visitType || !payload?.customerName || !payload?.customerPhone) {
      return res.status(400).json({ ok: false, message: "Missing required booking fields" });
    }

    const url = `${gas}?action=createBooking`;

    // Forward JSON body to GAS
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const text = await r.text();

    let data;
    try { data = JSON.parse(text); } catch { data = { ok: false, message: "Invalid JSON from GAS", raw: text }; }

    return res.status(r.ok ? 200 : 502).json(data);
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Proxy error", error: String(e?.message || e) });
  }
}
