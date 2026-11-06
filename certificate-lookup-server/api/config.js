module.exports = function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || "https://zero2306263-beep.github.io";
  if (req.headers.origin === origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") return res.status(405).json({ error:"METHOD_NOT_ALLOWED" });
  const configured = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.SHEETS_SPREADSHEET_ID);
  return res.status(200).json({ configured, googleClientId: configured ? process.env.GOOGLE_OAUTH_CLIENT_ID : null, requiresGoogleSignIn:true });
};