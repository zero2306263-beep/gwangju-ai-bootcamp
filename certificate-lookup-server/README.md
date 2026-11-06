# 광주대학교 AI부트캠프 학생 이수조회 API

Private Google Sheets -> authenticated Vercel API -> public GitHub Pages UI.

## Security and service status
- This service **does not** publish student rows to GitHub or to the browser.
- Login is required via Google Identity Services ID token (server verifies with Google).
- Student ID + name is **not** accepted as sufficient authentication.
- Access requires the authenticated Google email to be recorded in **every matching course row** in the private Sheet under \`H: 인증이메일\`.
- If the runtime secrets are not configured, \`GET /api/config\` returns \`configured:false\` and \`POST /api/lookup\` returns HTTP 503. **No live student lookup is enabled until then.**
- Restrict any student emails/domains, obtain institution privacy approval, and review access logs/retention before launch. Note there is no persistent rate limiter in this minimal example.

## Google Sheet
Private spreadsheet ID is supplied via \`SHEETS_SPREADSHEET_ID\`. Tab: \`이수자명단\`; columns A:H:
학번 | 학과 | 학생명 | 교과목명 | 이수상태 | 이수시간 | 교육기간 | 인증이메일.
Keep sharing restricted to the responsible office and the service-account client email. Never enable public link sharing or sheet publication.

## Runtime environment (Vercel production)
- \`SHEETS_SPREADSHEET_ID\` = private spreadsheet ID.
- \`GOOGLE_SERVICE_ACCOUNT_JSON\` = entire service account key JSON, entered as encrypted Vercel environment variable; do not commit it.
- \`GOOGLE_OAUTH_CLIENT_ID\` = Google Cloud OAuth 2.0 Web Application client ID for Google Identity Services. Authorized JavaScript origin must include \`https://zero2306263-beep.github.io\`.
- \`ALLOWED_ORIGIN\` = \`https://zero2306263-beep.github.io\`.
- \`ALLOWED_EMAIL_DOMAIN\` = optional institution Google Workspace domain. When set, only matching verified Google accounts qualify.
Configure Google Sheets API in the Google Cloud project, grant sheet Viewer to the service account, and fill the H email for each student. This runtime intentionally does not allow access before required variables are present.

## Routes
- GET /api/health — basic availability without student data
- GET /api/config — returns enablement state and public OAuth client ID
- POST /api/lookup — accepts { studentId, studentName, credential } with verified Google ID token.

Do not send ID tokens by query string. Do not log student IDs, names, tokens or email addresses.