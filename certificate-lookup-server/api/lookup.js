const {readSheet,verifyGoogleToken}=require("../lib/google");
module.exports=async function handler(req,res) {
  const origin=process.env.ALLOWED_ORIGIN || "https://zero2306263-beep.github.io";
  if(req.headers.origin === origin) {
    res.setHeader("Access-Control-Allow-Origin",origin);
    res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
  }
  res.setHeader("Vary","Origin");
  res.setHeader("Cache-Control","no-store, no-cache, max-age=0");
  res.setHeader("X-Content-Type-Options","nosniff");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  if(req.headers.origin && req.headers.origin!==origin)return res.status(403).json({error:"ORIGIN_NOT_ALLOWED"});
  if(!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.SHEETS_SPREADSHEET_ID)return res.status(503).json({error:"SERVICE_NOT_READY",message:"사업단의 본인인증·자료 연동 설정이 완료되지 않았습니다."});
  const body=typeof req.body==="object" && req.body ? req.body:{};
  const no=String(body.studentId||"").trim();
  const name=String(body.studentName||"").normalize("NFC").replace(/\s+/g,"").trim();
  const token=String(body.credential||"");
  if(!/^[0-9]{6,12}$/.test(no)||name.length<2||name.length>30||token.length<100||token.length>6000)return res.status(400).json({error:"INVALID_INPUT",message:"학번·학생명·본인인증 정보를 확인해 주세요."});
  try {
    const profile=await verifyGoogleToken(token);
    if(!profile)return res.status(401).json({error:"AUTH_REQUIRED",message:"Google 계정 인증을 다시 진행해 주세요."});
    const rows=await readSheet();
    const header=(rows[0]||[]).map(x=>String(x||"").trim());
    const cols=["학번","학과","학생명","교과목명","이수상태","이수시간","교육기간","인증이메일"];
    if(cols.some((x,i)=>header[i]!==x))return res.status(503).json({error:"SHEET_FORMAT_ERROR",message:"명단 서식을 관리자에게 확인해 주세요."});
    const matched=rows.slice(1).filter(r=>String(r[0]||"").trim()===no&&String(r[2]||"").normalize("NFC").replace(/\s+/g,"")===name);
    const verified=matched.length && matched.every(r=>String(r[7]||"").trim().toLowerCase()===profile.email);
    if(!verified)return res.status(404).json({error:"RECORD_NOT_FOUND",message:"인증된 계정과 일치하는 이수내역이 없습니다. 사업단에 학번·이메일 등록 여부를 확인해 주세요."});
    const courses=matched.map(r=>({course:String(r[3]||""),status:String(r[4]||"확인중"),hours:String(r[5]||""),period:String(r[6]||"")}));
    return res.status(200).json({student:{studentId:no,displayName:name.slice(0,1)+"*".repeat(Math.max(1,name.length-1)),department:String(matched[0][1]||"미등록")},courses});
  } catch (err) {
    console.error("Student lookup failed:",err.message);
    return res.status(503).json({error:"SERVICE_ERROR",message:"현재 조회 서비스에 접속할 수 없습니다. 잠시 후 다시 이용해 주세요."});
  }
};