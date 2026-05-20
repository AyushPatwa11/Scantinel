<div align="center"> 

```
 ███████╗ ██████╗ █████╗ ███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗
 ██╔════╝██╔════╝██╔══██╗████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║
 ███████╗██║     ███████║██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║
 ╚════██║██║     ██╔══██║██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║
 ███████║╚██████╗██║  ██║██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
 ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
```

### 🛡️ Security Intelligence Platform `v2.0`
 
*Because your website deserves better than "it probably works fine"* 

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)](https://expressjs.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## 🤔 What Even Is This?

**Scantinel** is a full-stack web vulnerability scanner that does what most developers *know they should do but never actually do* — audit their site's security before shipping it to the world.

You paste a URL. Scantinel sends it through **10 automated scanning phases** powered by real security tools (Nmap, Nikto), detects vulnerabilities ranging from "mildly concerning" to "oh no", grades your site **A through F**, and hands you a **beautiful PDF report** with plain-English explanations and exact fix steps.

No cybersecurity PhD required. Seriously.

```
You:          "Is my website secure?"
The Internet: "lol probably not"
Scantinel:    "Here's exactly what's wrong and how to fix it."
```

---

## ✨ Features That Actually Matter

| Feature | What it does |
|---|---|
| 🎯 **10-Phase Scanner** | Systematic security checks from recon to risk scoring |
| 🚨 **Real-Time Progress** | Live updates via Server-Sent Events (no annoying polling) |
| 📊 **Interactive Dashboard** | Charts, severity filters, findings breakdown — all in one view |
| 🤖 **AI-Style Explanations** | Converts "Missing X-Frame-Options" into human-readable danger warnings |
| 📄 **PDF Report Export** | Professional scan report downloadable in one click |
| 🗂️ **Scan History** | Every scan stored, searchable, and re-viewable |
| 🔢 **Risk Grading** | Letter grades A–F with a 0–100 risk score |
| 🛡️ **Rate Limited** | 20 scans per IP per 15 minutes — scanner, not a DDoS machine |
| 🐳 **Docker Ready** | One command to run the whole stack |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│   ┌──────────────┐    HTTP/SSE    ┌─────────────────────┐  │
│   │  React App   │ ◄────────────► │  Express API :5000  │  │
│   │  :3000       │                │                     │  │
│   └──────────────┘                │  ┌───────────────┐  │  │
│                                   │  │  Scanner.js   │  │  │
│   HomePage  ──► ScanPage          │  │  (Core Engine)│  │  │
│   (landing)     (live scan)       │  └───────┬───────┘  │  │
│                                   │          │          │  │
│   ResultsDashboard                │    ┌─────▼──────┐   │  │
│   (findings + charts)             │    │  Nmap/Nikto│   │  │
│                                   │    │  TCP Scan  │   │  │
│                                   └────┼────────────┼───┘  │
│                                        │   MongoDB  │       │
│                                        │   :27017   │       │
│                                        └────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User types URL
      │
      ▼
POST /api/scans          ← Backend creates scan doc, returns scanId
      │
      ▼
SSE Stream opens         ← Frontend connects to /api/scans/:id/stream
      │
      ▼
10 Scan Phases run       ← Each phase emits progress events in real-time
      │
      ▼
Results saved to MongoDB ← findings, openPorts, summary, headers stored
      │
      ▼
ResultsDashboard renders ← Charts, FindingCards, PortsPanel, PDF export
```

---

## 🗂️ Project Structure

```
scantinel/
│
├── 📁 backend/
│   ├── 📁 middleware/
│   │   ├── asyncHandler.js        # Wraps async routes to catch errors
│   │   └── validator.js           # URL validation before scan starts
│   ├── 📁 models/
│   │   └── Scan.js                # Mongoose schema: findings, ports, summary
│   ├── 📁 routes/
│   │   └── scans.js               # REST API + SSE streaming endpoint
│   ├── 📁 services/
│   │   └── scanner.js             # ⭐ Core scan engine (all 10 phases)
│   ├── server.js                  # Express entry point, CORS, rate limiter
│   ├── Dockerfile                 # Backend container config
│   ├── .env                       # Your secrets (never commit this)
│   └── .env.example               # What secrets to put in .env
│
├── 📁 frontend/
│   ├── 📁 public/
│   │   └── index.html             # Root HTML shell
│   └── 📁 src/
│       ├── 📁 components/
│       │   ├── FindingCard         # Expandable finding with CVSS + fix
│       │   ├── HeadersPanel        # HTTP response headers display
│       │   ├── PortsPanel          # Open port grid with risk badges
│       │   ├── ResultsDashboard    # Full results: charts + tabs + export
│       │   ├── ScoreGauge          # Circular risk score visualizer
│       │   ├── ScanningView        # Live Lottie radar + step progress
│       │   └── TechnologiesPanel   # Detected tech stack chips
│       ├── 📁 hooks/
│       │   └── useScan.js          # SSE connection + state management
│       ├── 📁 pages/
│       │   ├── HomePage            # Landing, URL input, scan history
│       │   └── ScanPage            # Scan orchestration (scanning → results)
│       ├── 📁 styles/
│       │   └── globals.css         # Design tokens, keyframes, base styles
│       ├── 📁 utils/
│       │   ├── api.js              # Axios client + SSE factory function
│       │   ├── helpers.js          # Severity/grade metadata helpers
│       │   └── reportGenerator.js  # jsPDF v4 report builder
│       ├── App.js                  # Root component + view router
│       └── index.js               # React DOM entry point
│
├── docker-compose.yml             # Full stack: Mongo + API + Frontend
├── .gitignore
└── README.md                      # You are here 📍
```

---

## 🔍 The 10 Scanning Phases

> *Every phase runs automatically, in order, the moment you hit Scan.*

```
Phase 01 ─ Reconnaissance       Reach the target, detect technologies
Phase 02 ─ Header Analysis      HSTS, CSP, X-Frame-Options, Referrer-Policy...
Phase 03 ─ Encryption           HTTPS enforcement, HTTP→HTTPS redirect
Phase 04 ─ Information Leakage  Server version, X-Powered-By, verbose errors
Phase 05 ─ Cookie Security      Secure, HttpOnly, SameSite flags on all cookies
Phase 06 ─ Access Control       CORS wildcard, credentials misconfiguration
Phase 07 ─ Exposed Resources    .git, .env, wp-config.php, database backups
Phase 08 ─ Port Scanning        29 common ports via TCP connect + Nmap
Phase 09 ─ Content Security     Mixed content, forms without CSRF tokens
Phase 10 ─ Risk Assessment      Final score 0–100, grade A–F assignment
```

### Risk Grade Scale

| Grade | Score | Meaning |
|:---:|:---:|---|
| 🟢 **A** | 85–100 | Excellent. You've done your homework. |
| 🔵 **B** | 70–84 | Good. A few things to tighten up. |
| 🟡 **C** | 50–69 | Concerning. Some real issues present. |
| 🟠 **D** | 30–49 | Dangerous. Fix these before going live. |
| 🔴 **F** | 0–29 | Critical. Your site is basically a welcome mat for attackers. |

---

## 🛠️ Tech Stack

### Backend
| Tech | Version | Role |
|---|---|---|
| **Node.js** | 18+ | Runtime |
| **Express.js** | 4.x | REST API framework |
| **MongoDB** | 7.0 | Scan data persistence |
| **Mongoose** | 7.x | ODM / schema validation |
| **Nmap / Nikto** | System | Network & web vulnerability scanning |
| **SSE** | Native | Real-time scan progress streaming |
| **express-rate-limit** | — | 20 scans / 15 min per IP |

### Frontend
| Tech | Version | Role |
|---|---|---|
| **React** | 18 | UI framework |
| **jsPDF** | 4.x | PDF report generation |
| **jspdf-autotable** | 5.x | Tables inside PDF reports |
| **Recharts** | 2.x | Bar chart + radar chart |
| **lottie-web** | 5.x | Animated scanning radar |
| **lucide-react** | 0.383 | Icon library |
| **axios** | 1.x | HTTP client |
| **Vanilla CSS** | — | Custom design system (no Tailwind) |

### Infrastructure
| Tech | Role |
|---|---|
| **Docker + Docker Compose** | Full-stack containerization |
| **Nginx** | Serves frontend in production container |

---

## 🚀 Getting Started

### Option A — Local Development (Recommended)

**Prerequisites:**
- Node.js 18+
- MongoDB running locally or a [MongoDB Atlas](https://cloud.mongodb.com) connection string

**Step 1 — Clone & enter the project**
```bash
git clone https://github.com/yourname/scantinel.git
cd scantinel
```

**Step 2 — Set up the backend**
```bash
cd backend
npm install

# Copy example env and fill in your values
cp .env.example .env
# Edit .env:
#   MONGO_URI=mongodb://localhost:27017/scantinel
#   PORT=5000

npm run dev
# ✅ API running at http://localhost:5000
```

**Step 3 — Set up the frontend** *(in a new terminal)*
```bash
cd frontend
npm install
npm start
# ✅ App running at http://localhost:3000
```

**Step 4 — Open your browser, paste a URL, watch the magic 🎉**

---

### Option B — Docker (One Command)

```bash
# From the project root
docker-compose up --build

# Services:
# ✅ MongoDB   → localhost:27017
# ✅ API       → localhost:5000
# ✅ Frontend  → localhost:3000
```

To stop:
```bash
docker-compose down        # Stop containers
docker-compose down -v     # Stop + delete Mongo data volume
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scans` | Start a new scan. Body: `{ "url": "https://example.com" }` |
| `GET` | `/scans` | List recent scans (default 10, max 50). Query: `?limit=N` |
| `GET` | `/scans/:id` | Get full scan result by ID |
| `GET` | `/scans/:id/stream` | **SSE** — subscribe to live scan progress events |
| `GET` | `/scans/:id/report` | Download scan as JSON file |
| `DELETE` | `/scans/:id` | Delete a scan permanently |
| `GET` | `/health` | Health check — returns `{ status: "ok" }` |

### Example: Start a scan

```bash
curl -X POST http://localhost:5000/api/scans \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://example.com" }'

# Response:
# { "scanId": "abc-123-...", "status": "queued" }
```

### SSE Event Format

```js
// Connect to the stream
const es = new EventSource('/api/scans/abc-123/stream');
es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  // data = { event: 'progress', progress: 45, currentStep: 'Checking cookies...', phase: 'Cookie Security' }
  // data = { event: 'complete', status: 'completed', progress: 100 }
  // data = { event: 'error', status: 'failed', error: '...' }
};
```

---

## ⚙️ Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# Required
MONGO_URI=mongodb://localhost:27017/scantinel
PORT=5000

# Optional (defaults shown)
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes in ms
RATE_LIMIT_MAX=20             # Max scans per window per IP
```

---

## 🧩 Extending Scantinel

### Adding Real Nmap Integration

The port scanner currently uses native Node.js TCP connects (no binary deps). To upgrade to full Nmap:

```bash
# 1. Install Nmap system-wide
# Windows: https://nmap.org/download.html
# macOS:   brew install nmap
# Linux:   apt install nmap

# 2. Install the Node wrapper (backend only)
cd backend
npm install node-nmap --save
```

Then in `backend/services/scanner.js`, replace the TCP connect phase with:
```js
const nmap = require('node-nmap');
nmap.nmapLocation = 'nmap'; // or full path on Windows
const scanner = new nmap.QuickScan('example.com');
scanner.on('complete', (data) => { /* process data */ });
scanner.startScan();
```

### Adding Nikto Integration

```bash
# 1. Install Nikto
# Linux: apt install nikto
# macOS: brew install nikto

# 2. Call it from scanner.js using child_process
const { exec } = require('child_process');
exec(`nikto -h ${hostname} -output /tmp/nikto-${scanId}.txt`, (err, stdout) => {
  // parse stdout or output file
});
```

---

## 🐛 Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `ECONNREFUSED` on scan start | MongoDB not running | Start MongoDB: `mongod` or `docker-compose up mongo` |
| Scan stuck at 0% | Backend not reachable | Check `localhost:5000/api/health` |
| PDF downloads but appears blank | jsPDF version mismatch | Make sure `jspdf ^4.2.1` and `jspdf-autotable ^5.0.7` are installed |
| Lottie animation missing | `radar-lottie.json` not copied | Run: `Copy-Item "responsive black.json" "frontend/src/components/radar-lottie.json"` |
| Frontend can't reach API | Proxy not set | Check `"proxy": "http://localhost:5000"` in `frontend/package.json` |
| Video intro not playing | Autoplay policy blocked | Most browsers allow autoplay if `muted` + `playsInline` are set (already done) |

---

## 📂 Key Files to Know

| File | Why You Care |
|---|---|
| `backend/services/scanner.js` | The brain. All 10 scan phases live here. |
| `backend/models/Scan.js` | MongoDB schema — add new fields here. |
| `frontend/src/utils/reportGenerator.js` | PDF builder. Customize report layout here. |
| `frontend/src/pages/HomePage.js` | Landing page + all 5 nav sections. |
| `frontend/src/styles/globals.css` | Design token system — change colors/fonts here. |
| `docker-compose.yml` | One-command production stack. |

---

## 🔒 Security Notes

- **Never scan a website you don't own** — always get permission first
- Rate limiting is enforced server-side (20 scans / 15 min / IP)
- The `.env` file is in `.gitignore` — never commit secrets
- All findings are stored in MongoDB; implement auth before exposing to users

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-awesome-scanner`
3. Commit with a clear message: `git commit -m "feat: add XSS detection phase"`
4. Push: `git push origin feat/my-awesome-scanner`
5. Open a Pull Request

---

## 📄 License

MIT — use it, learn from it, build on it. Just don't use it to scan sites you don't own. 🛡️

---

<div align="center">

**Built with 🔐 paranoia and ☕ caffeine**

*If this project helped you find a vulnerability in your own site, that's exactly what it's for.*

</div>
