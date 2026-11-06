module.exports = function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  if(req.method !== "GET") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  return res.status(200).json({service:"gu-bootcamp-course-lookup",status:"running",studentDataAvailable:Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.SHEETS_SPREADSHEET_ID)});
};