/**
 * JobScout Proxy Server
 * ---------------------
 * Sits between the browser and job APIs to solve CORS.
 * The browser calls this server; this server calls the real APIs.
 *
 * Deploy free on Railway → https://railway.app
 *   1. Push this file + package.json to a GitHub repo
 *   2. New project → Deploy from GitHub repo
 *   3. Railway auto-detects Node.js and runs "npm start"
 *   4. Copy the generated URL into JobScout Settings → Proxy Server URL
 *
 * Or run locally:
 *   npm install && node proxy-server.js
 *   Then use http://localhost:3000 as your proxy URL
 */

const express  = require("express");
const cors     = require("cors");
const fetch    = require("node-fetch");

const app  = express();
const PORT = process.env.PORT || 3000;

/* Allow requests from any origin (the browser's Claude.ai domain) */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ── Health check ─────────────────────────────── */
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "JobScout Proxy", version: "1.0.0" });
});

/* ── Helper: forward errors cleanly ──────────── */
const forward = async (res, fn) => {
  try {
    const data = await fn();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* ── 1. Remotive ─────────────────────────────── */
app.get("/remotive", (req, res) => forward(res, async () => {
  const params = new URLSearchParams(req.query);
  const r = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
  if (!r.ok) throw new Error(`Remotive error: ${r.status}`);
  return r.json();
}));

/* ── 2. Arbeitnow ────────────────────────────── */
app.get("/arbeitnow", (req, res) => forward(res, async () => {
  const params = new URLSearchParams(req.query);
  const r = await fetch(`https://www.arbeitnow.com/api/job-board-api?${params}`);
  if (!r.ok) throw new Error(`Arbeitnow error: ${r.status}`);
  return r.json();
}));

/* ── 3. The Muse ─────────────────────────────── */
app.get("/themuse", (req, res) => forward(res, async () => {
  const params = new URLSearchParams(req.query);
  const r = await fetch(`https://www.themuse.com/api/public/jobs?${params}`);
  if (!r.ok) throw new Error(`The Muse error: ${r.status}`);
  return r.json();
}));

/* ── 4. JSearch (RapidAPI) ───────────────────── */
/* Pass your RapidAPI key as header: x-rapidapi-key */
app.get("/jsearch", (req, res) => forward(res, async () => {
  const apiKey = req.headers["x-rapidapi-key"];
  if (!apiKey) throw new Error("Missing x-rapidapi-key header");
  const params = new URLSearchParams(req.query);
  const r = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
    headers: {
      "X-RapidAPI-Key":  apiKey,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });
  if (!r.ok) throw new Error(`JSearch error: ${r.status}`);
  return r.json();
}));

/* ── 5. Adzuna ───────────────────────────────── */
/* Pass app_id and app_key as query params (already included by the frontend) */
app.get("/adzuna", (req, res) => forward(res, async () => {
  const params = new URLSearchParams(req.query);
  const r = await fetch(`https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`);
  if (!r.ok) throw new Error(`Adzuna error: ${r.status}`);
  return r.json();
}));

/* ── 6. Reed.co.uk ───────────────────────────── */
/* Pass your Reed API key as header: authorization (Basic base64(key:)) */
app.get("/reed", (req, res) => forward(res, async () => {
  const auth = req.headers["authorization"];
  if (!auth) throw new Error("Missing Authorization header");
  const params = new URLSearchParams(req.query);
  const r = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`Reed error: ${r.status}`);
  return r.json();
}));

/* ── Start ───────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`✅ JobScout proxy running on http://localhost:${PORT}`);
  console.log("Endpoints: /remotive /arbeitnow /themuse /jsearch /adzuna /reed");
});
