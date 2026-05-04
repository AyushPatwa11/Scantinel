# VulnScan — Security Intelligence Platform v2.0

Professional web-based vulnerability scanner with real-time progress tracking, interactive dashboard, and PDF export.

---

## Project Structure

```
vulnscan/
├── backend/
│   ├── models/
│   │   └── Scan.js              # Mongoose schema (findings, ports, summary)
│   ├── routes/
│   │   └── scans.js             # REST API + SSE streaming endpoint
│   ├── services/
│   │   └── scanner.js           # Core scan engine (all security checks)
│   ├── server.js                # Express entry point
│   ├── .env                     # Environment config
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── FindingCard.js/.css      # Expandable finding with severity
        │   ├── PortsPanel.js/.css       # Port grid with risk badges
        │   ├── ResultsDashboard.js/.css # Full results with charts
        │   └── ScanningView.js/.css     # Animated radar + step list
        ├── hooks/
        │   └── useScan.js               # SSE + state management hook
        ├── pages/
        │   ├── HomePage.js/.css         # Landing + URL input + history
        │   └── ScanPage.js/.css         # Scan orchestration page
        ├── styles/
        │   └── globals.css              # Design tokens + keyframes
        ├── utils/
        │   ├── api.js                   # Axios client + SSE factory
        │   ├── helpers.js               # Severity/grade helpers
        │   └── reportGenerator.js       # jsPDF report export
        ├── App.js
        └── index.js
```

---

## Setup

### Requirements
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend

```bash
cd backend
npm install
# Edit .env if needed (MONGO_URI, PORT)
npm run dev
# → http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

---

## Security Checks (10 Phases)

| Phase | Check |
|---|---|
| Reconnaissance | HTTP reachability, technology detection |
| Header Analysis | HSTS, CSP, X-Frame-Options, MIME sniffing, Referrer-Policy, Permissions-Policy, COEP |
| Encryption | HTTPS enforcement, HTTP→HTTPS redirect |
| Information Leakage | Server version, X-Powered-By, verbose error pages |
| Cookie Security | Secure, HttpOnly, SameSite flags |
| Access Control | CORS wildcard, credentials+wildcard misconfiguration |
| Exposed Resources | .git, .env, phpinfo.php, wp-config.php, database backups, admin panels |
| Port Scanning | 29 common ports via TCP connect scan |
| Content Security | Mixed content, forms without CSRF tokens |
| Risk Assessment | Score calculation, grade assignment (A-F) |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/scans | Start a scan |
| GET | /api/scans | List recent scans |
| GET | /api/scans/:id | Get scan result |
| GET | /api/scans/:id/stream | SSE progress stream |
| GET | /api/scans/:id/report | Download JSON report |
| DELETE | /api/scans/:id | Delete a scan |
| GET | /api/health | Health check |

---

## Extending with Nmap / Nikto

To add real Nmap integration, install Nmap system-wide and replace the TCP connect scan in `scanner.js`:

```bash
npm install node-nmap --save   # backend only
```

Then use `nmap.quickScan(hostname, ...)` in the port scanning phase.

---

## Notes

- Port scanning uses native Node.js TCP connect — no binary dependencies
- SSE provides real-time scan progress without polling
- All findings include CVSS scores, CWE IDs, plain-language descriptions, and fix recommendations
- Rate limited to 20 scans per 15 minutes per IP
