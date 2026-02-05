export default async function handler(req, res) {
  // CORS headers (useful if you later call this API from other domains too)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const gas = process.env.GAS_WEBAPP_URL;
    if (!gas) return res.status(500).json({ ok: false, message: "Missing GAS_WEBAPP_URL env var" });

    const date = (req.query.date || "").toString().trim();
    const visitType = (req.query.visitType || "").toString().trim();

    if (!date || !visitType) {
      return res.status(400).json({ ok: false, message: "Missing date or visitType" });
    }

    const url =
      `${gas}?action=getAvailability` +
      `&date=${encodeURIComponent(date)}` +
      `&visitType=${encodeURIComponent(visitType)}`;

    const r = await fetch(url, { method: "GET" });
    const text = await r.text();

    // GAS often returns text; try JSON parse safely
    let data;
    try { data = JSON.parse(text); } catch { data = { ok: false, message: "Invalid JSON from GAS", raw: text }; }

    return res.status(r.ok ? 200 : 502).json(data);
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Proxy error", error: String(e?.message || e) });
  }
}
