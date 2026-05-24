/**
 * JobScout Proxy Server — v2 (native fetch, no node-fetch)
 * Requires Node 18+ (Railway default)
 */
const express = require("express");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

/* Health check — visit your Railway URL to confirm it's running */
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "JobScout Proxy", node: process.version });
});

/* ── 1. Remotive ── */
app.get("/remotive", async (req, res) => {
  try {
    const r = await fetch(`https://remotive.com/api/remote-jobs?${new URLSearchParams(req.query)}`);
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── 2. Arbeitnow ── */
app.get("/arbeitnow", async (req, res) => {
  try {
    const r = await fetch(`https://www.arbeitnow.com/api/job-board-api?${new URLSearchParams(req.query)}`);
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── 3. The Muse ── */
app.get("/themuse", async (req, res) => {
  try {
    const r = await fetch(`https://www.themuse.com/api/public/jobs?${new URLSearchParams(req.query)}`);
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── 4. JSearch (RapidAPI) — send key as header x-rapidapi-key ── */
app.get("/jsearch", async (req, res) => {
  try {
    const key = req.headers["x-rapidapi-key"];
    if (!key) return res.status(400).json({ error: "Missing x-rapidapi-key header" });
    const r = await fetch(`https://jsearch.p.rapidapi.com/search?${new URLSearchParams(req.query)}`, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" },
    });
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── 5. Adzuna — app_id & app_key already in query params ── */
app.get("/adzuna", async (req, res) => {
  try {
    const r = await fetch(`https://api.adzuna.com/v1/api/jobs/us/search/1?${new URLSearchParams(req.query)}`);
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── 6. Reed.co.uk — send key as header authorization ── */
app.get("/reed", async (req, res) => {
  try {
    const auth = req.headers["authorization"];
    if (!auth) return res.status(400).json({ error: "Missing Authorization header" });
    const r = await fetch(`https://www.reed.co.uk/api/1.0/search?${new URLSearchParams(req.query)}`, {
      headers: { Authorization: auth, Accept: "application/json" },
    });
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`JobScout proxy running on port ${PORT}`));
