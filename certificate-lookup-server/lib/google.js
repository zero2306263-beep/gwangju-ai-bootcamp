const crypto = require("node:crypto");
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SHEET_BASE = "https://sheets.googleapis.com/v4/spreadsheets/";
function enc(o){return Buffer.from(JSON.stringify(o)).toString("base64url")}
async function readSheet() {
  const spreadsheet = process.env.SHEETS_SPREADSHEET_ID;
  if (!spreadsheet || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) throw new Error("BACKEND_NOT_CONFIGURED");
  const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (!sa.client_email || !sa.private_key) throw new Error("SERVICE_ACCOUNT_INVALID");
  const now = Math.floor(Date.now()/1000);
  const jwt = enc({alg:"RS256",typ:"JWT"})+"."+enc({iss:sa.client_email,scope:"https://www.googleapis.com/auth/spreadsheets.readonly",aud:TOKEN_ENDPOINT,iat:now,exp:now+3000});
  const signature = crypto.sign("RSA-SHA256",Buffer.from(jwt),sa.private_key).toString("base64url");
  const tokenRes = await fetch(TOKEN_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt+"."+signature}),signal:AbortSignal.timeout(7000)});
  if (!tokenRes.ok) throw new Error("SHEETS_AUTH_FAILED");
  const token = await tokenRes.json();
  const range = encodeURIComponent("'이수자명단'!A1:H5000");
  const sheetRes = await fetch(SHEET_BASE+encodeURIComponent(spreadsheet)+"/values/"+range+"?valueRenderOption=FORMATTED_VALUE",{headers:{Authorization:"Bearer "+token.access_token},signal:AbortSignal.timeout(7000)});
  if (!sheetRes.ok) throw new Error("SHEETS_READ_FAILED_"+sheetRes.status);
  return (await sheetRes.json()).values || [];
}
async function verifyGoogleToken(idToken){
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if(!clientId) throw new Error("BACKEND_NOT_CONFIGURED");
  const u = new URL("https://oauth2.googleapis.com/tokeninfo");
  u.searchParams.set("id_token",idToken);
  const response = await fetch(u,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(7000)});
  if(!response.ok) return null;
  const tok = await response.json();
  const trustedIssuer = ["accounts.google.com","https://accounts.google.com"].includes(tok.iss);
  if (!trustedIssuer || tok.aud!==clientId || tok.email_verified!=="true" || Number(tok.exp) <= Math.floor(Date.now()/1000)) return null;
  const email = String(tok.email||"").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  const domain = process.env.ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase();
  if(domain && !email.endsWith("@"+domain)) return null;
  return {email};
}
module.exports={readSheet,verifyGoogleToken};