const net = require('net');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ─── Port definitions ─────────────────────────────────────────────────────────
const PORT_MAP = {
  20:    { service: 'FTP-Data',       risk: 'high'     },
  21:    { service: 'FTP',            risk: 'high'     },
  22:    { service: 'SSH',            risk: 'low'      },
  23:    { service: 'Telnet',         risk: 'critical' },
  25:    { service: 'SMTP',           risk: 'medium'   },
  53:    { service: 'DNS',            risk: 'low'      },
  80:    { service: 'HTTP',           risk: 'safe'     },
  110:   { service: 'POP3',           risk: 'medium'   },
  111:   { service: 'RPC',            risk: 'high'     },
  135:   { service: 'RPC-Endpoint',   risk: 'high'     },
  139:   { service: 'NetBIOS',        risk: 'high'     },
  143:   { service: 'IMAP',           risk: 'medium'   },
  443:   { service: 'HTTPS',          risk: 'safe'     },
  445:   { service: 'SMB',            risk: 'critical' },
  1433:  { service: 'MSSQL',          risk: 'critical' },
  1521:  { service: 'Oracle DB',      risk: 'critical' },
  2049:  { service: 'NFS',            risk: 'high'     },
  3000:  { service: 'Dev Server',     risk: 'medium'   },
  3306:  { service: 'MySQL',          risk: 'critical' },
  3389:  { service: 'RDP',            risk: 'critical' },
  4444:  { service: 'Metasploit',     risk: 'critical' },
  5432:  { service: 'PostgreSQL',     risk: 'critical' },
  5900:  { service: 'VNC',            risk: 'critical' },
  6379:  { service: 'Redis',          risk: 'critical' },
  7070:  { service: 'RealAudio',      risk: 'medium'   },
  8080:  { service: 'HTTP-Proxy',     risk: 'medium'   },
  8443:  { service: 'HTTPS-Alt',      risk: 'low'      },
  8888:  { service: 'HTTP-Alt',       risk: 'medium'   },
  9200:  { service: 'Elasticsearch',  risk: 'critical' },
  27017: { service: 'MongoDB',        risk: 'critical' },
  27018: { service: 'MongoDB-Shard',  risk: 'critical' }
};

const RISKY_PORT_FINDINGS = {
  23:    { severity: 'critical', title: 'Telnet Service Exposed', cvss: 9.8, cwe: 'CWE-319', description: 'Telnet transmits ALL data — including usernames and passwords — in plain text. Any attacker on the network can read everything.', impact: 'Complete credential theft and full server compromise.', recommendation: 'Disable Telnet immediately. Use SSH (port 22) for all remote access. Block port 23 at your firewall permanently.' },
  21:    { severity: 'high',     title: 'FTP Service Open',        cvss: 7.5, cwe: 'CWE-319', description: 'FTP sends files and login credentials without encryption. Attackers can intercept transfers and steal passwords.', impact: 'Credential theft, unauthorized file access.', recommendation: 'Replace FTP with SFTP or FTPS. If FTP is necessary, restrict access to whitelisted IP addresses.' },
  445:   { severity: 'critical', title: 'SMB Port Exposed (WannaCry Risk)', cvss: 9.8, cwe: 'CWE-284', description: 'SMB port 445 is the attack vector for WannaCry ransomware and EternalBlue exploits. Exposing this publicly is extremely dangerous.', impact: 'Ransomware infection, full network compromise.', recommendation: 'Block port 445 at the network firewall immediately. SMB should never be exposed to the internet.' },
  3389:  { severity: 'critical', title: 'Remote Desktop (RDP) Publicly Accessible', cvss: 9.8, cwe: 'CWE-287', description: 'Windows Remote Desktop is open to the internet. RDP is the #1 entry point for ransomware attacks via brute-force or BlueKeep exploits.', impact: 'Ransomware, complete server takeover.', recommendation: 'Block RDP from the internet. Use a VPN for remote access. Restrict to specific IP addresses.' },
  3306:  { severity: 'critical', title: 'MySQL Database Publicly Exposed', cvss: 9.1, cwe: 'CWE-284', description: 'Your MySQL database is accessible directly from the internet. Attackers can attempt to log in and steal all your data.', impact: 'Complete data breach of all database contents.', recommendation: 'Block port 3306 in your firewall. Databases must only be accessible from your application server internally.' },
  5432:  { severity: 'critical', title: 'PostgreSQL Database Exposed', cvss: 9.1, cwe: 'CWE-284', description: 'PostgreSQL database port is open to the internet. This allows direct connection attempts from anyone in the world.', impact: 'Full database compromise and data breach.', recommendation: 'Restrict port 5432 to internal network only. Never expose databases to the public internet.' },
  6379:  { severity: 'critical', title: 'Redis Cache Accessible (No Auth by Default)', cvss: 9.8, cwe: 'CWE-306', description: 'Redis has no authentication by default. An exposed Redis instance can be fully read and written by anyone, leading to data theft or server compromise.', impact: 'Data theft, malware installation via cron jobs, complete compromise.', recommendation: 'Immediately bind Redis to 127.0.0.1. Enable requirepass authentication. Block port 6379 at the firewall.' },
  27017: { severity: 'critical', title: 'MongoDB Database Exposed', cvss: 9.8, cwe: 'CWE-306', description: 'MongoDB with default settings has no authentication. This has caused thousands of real-world data breaches. Anyone can read and delete your data.', impact: 'Complete data breach or ransomware (data deleted, ransom demanded).', recommendation: 'Enable MongoDB authentication immediately. Bind to localhost. Block port 27017 in your firewall.' },
  9200:  { severity: 'critical', title: 'Elasticsearch Exposed', cvss: 9.8, cwe: 'CWE-306', description: 'Elasticsearch has no authentication by default and the API is public. Attackers can read all indexed data with a simple HTTP request.', impact: 'Full data leak of all indexed content.', recommendation: 'Enable X-Pack security. Restrict access to internal IPs. Block port 9200 publicly.' },
  5900:  { severity: 'critical', title: 'VNC Remote Desktop Exposed', cvss: 9.8, cwe: 'CWE-287', description: 'VNC gives graphical remote access to your desktop. Publicly exposed VNC is a critical security risk vulnerable to brute-force attacks.', impact: 'Full graphical desktop takeover.', recommendation: 'Block VNC from the internet. Use a VPN. Enable strong password protection.' },
  4444:  { severity: 'critical', title: 'Metasploit Default Port Open', cvss: 10.0, cwe: 'CWE-78', description: 'Port 4444 is the default Metasploit reverse shell port. This strongly indicates the system may already be compromised.', impact: 'Likely active compromise / backdoor present.', recommendation: 'Treat this as a security incident immediately. Isolate the server, conduct a forensic investigation.' },
  1433:  { severity: 'critical', title: 'MSSQL Server Exposed', cvss: 9.1, cwe: 'CWE-284', description: 'Microsoft SQL Server is publicly accessible. Attackers can attempt SQL authentication attacks to gain database access.', impact: 'Full database compromise.', recommendation: 'Block port 1433 at the firewall. SQL Server should only be accessible internally.' }
};

// ─── Sensitive paths to check ─────────────────────────────────────────────────
const SENSITIVE_PATHS = [
  { path: '/.git/HEAD',          severity: 'critical', title: 'Git Repository Exposed', cvss: 9.1, description: 'Your source code repository is publicly accessible. Attackers can download your entire codebase, including hard-coded credentials, API keys, and internal business logic.', impact: 'Source code theft, exposed secrets, API keys.', recommendation: 'Block access to /.git/ in your server config. For Nginx: "location ~ /\\.git { deny all; }". For Apache: add ".git" to forbidden directories.' },
  { path: '/.env',               severity: 'critical', title: 'Environment Config File Exposed', cvss: 9.8, description: 'Your .env configuration file is publicly readable. This file typically contains database passwords, API keys, encryption secrets, and other critical credentials.', impact: 'All secrets and credentials fully compromised.', recommendation: 'Remove .env from your web root immediately. Add .env to .gitignore. Move secrets to environment variables or a secrets manager.' },
  { path: '/.env.local',         severity: 'critical', title: 'Local Environment File Exposed', cvss: 9.8, description: 'Local environment configuration file is publicly accessible, potentially exposing development credentials and secrets.', impact: 'Development credentials and secrets exposed.', recommendation: 'Block access to all .env* files at the server level.' },
  { path: '/phpinfo.php',         severity: 'high',     title: 'PHP Info Page Exposed', cvss: 7.5, description: 'phpinfo() reveals your server configuration, PHP version, installed modules, file paths, and server environment variables. Attackers use this to plan targeted attacks.', impact: 'Server intelligence for targeted exploitation.', recommendation: 'Delete phpinfo.php immediately. Never leave diagnostic files on production servers.' },
  { path: '/config.php',          severity: 'high',     title: 'Configuration File Accessible', cvss: 8.0, description: 'A configuration file is accessible. It may contain database credentials, API keys, or other sensitive settings.', impact: 'Potential credential and configuration exposure.', recommendation: 'Move configuration files outside the web root. Restrict access via server configuration.' },
  { path: '/wp-config.php',       severity: 'critical', title: 'WordPress Config Exposed', cvss: 9.8, description: 'WordPress configuration file is accessible. This file contains your database credentials, authentication keys, and security salts.', impact: 'Full WordPress database access, site takeover.', recommendation: 'This file should never be readable. Check your server configuration. A properly configured server returns 403 for this file.' },
  { path: '/wp-login.php',        severity: 'medium',   title: 'WordPress Login Page Exposed', cvss: 5.3, description: 'WordPress admin login is publicly accessible. This is frequently targeted by brute-force attacks and credential stuffing.', impact: 'Brute-force attacks on admin credentials.', recommendation: 'Restrict /wp-login.php to your IP address. Enable two-factor authentication. Consider moving to a custom login URL.' },
  { path: '/wp-admin/',           severity: 'medium',   title: 'WordPress Admin Panel Accessible', cvss: 5.3, description: 'WordPress admin dashboard is publicly accessible without IP restrictions.', impact: 'Admin panel brute-force attacks.', recommendation: 'Restrict /wp-admin/ to specific IP addresses in your server configuration.' },
  { path: '/admin/',              severity: 'medium',   title: 'Admin Panel Exposed', cvss: 5.3, description: 'An admin panel was found at /admin/. Publicly accessible admin interfaces increase attack surface significantly.', impact: 'Unauthorized admin access attempts.', recommendation: 'Restrict admin panel to trusted IPs. Require VPN access. Implement account lockout policies.' },
  { path: '/admin/login',         severity: 'medium',   title: 'Admin Login Found', cvss: 5.3, description: 'Admin login page detected. Publicly accessible login pages are targets for credential stuffing and brute-force attacks.', impact: 'Brute-force authentication attacks.', recommendation: 'Restrict to trusted IPs, implement rate limiting and 2FA.' },
  { path: '/server-status',       severity: 'medium',   title: 'Apache Server Status Exposed', cvss: 5.3, description: 'Apache mod_status is enabled and publicly accessible, leaking real-time server statistics including current requests, client IPs, and bandwidth.', impact: 'Server intelligence and operational data leakage.', recommendation: 'Disable mod_status or restrict to internal IPs: "Require ip 127.0.0.1".' },
  { path: '/server-info',         severity: 'medium',   title: 'Apache Server Info Exposed', cvss: 5.3, description: 'Apache server information page exposes module configuration, directives, and server details useful for targeted attacks.', impact: 'Detailed server configuration intelligence.', recommendation: 'Disable mod_info or restrict to localhost.' },
  { path: '/.DS_Store',           severity: 'low',      title: 'macOS Metadata File Found', cvss: 3.5, description: 'A .DS_Store file was found, revealing your directory structure and file names (macOS metadata artifact left from development).', impact: 'Directory structure disclosure.', recommendation: 'Delete .DS_Store files and add them to .gitignore. Use "find . -name .DS_Store -delete" on your server.' },
  { path: '/backup.sql',          severity: 'critical', title: 'SQL Database Backup Exposed', cvss: 9.8, description: 'A SQL database backup file is publicly accessible. This file contains all your database contents.', impact: 'Complete database dump accessible to anyone.', recommendation: 'Remove database backups from the web root immediately. Store backups in a private, non-web-accessible location.' },
  { path: '/dump.sql',            severity: 'critical', title: 'SQL Dump File Exposed', cvss: 9.8, description: 'A database dump file is publicly accessible.', impact: 'Complete database contents exposed.', recommendation: 'Remove immediately. Never store database dumps in the web root.' },
  { path: '/backup.zip',          severity: 'high',     title: 'Backup Archive Exposed', cvss: 8.5, description: 'A backup zip file is accessible, potentially containing source code, configurations, or data.', impact: 'Source code and data exposure.', recommendation: 'Remove backup files from the web root. Store securely off-server.' },
  { path: '/robots.txt',          severity: 'info',     title: 'Robots.txt Found', cvss: 0.0, description: 'A robots.txt file exists. While not a vulnerability, it may reveal private paths you want to keep hidden from search engines.', impact: 'Path disclosure that aids attacker reconnaissance.', recommendation: 'Review robots.txt contents. Using "Disallow" is not security — it merely hints. Properly protect paths with authentication.' },
  { path: '/sitemap.xml',         severity: 'info',     title: 'Sitemap Accessible', cvss: 0.0, description: 'Sitemap reveals all publicly indexed URLs of your site. Not a vulnerability but useful for attacker reconnaissance.', impact: 'URL enumeration.', recommendation: 'Ensure that all URLs listed are intended to be public.' },
  { path: '/.well-known/security.txt', severity: 'info', title: 'Security.txt Present', cvss: 0.0, description: 'A security.txt file was found. This is actually a good practice for responsible disclosure.', impact: 'None — positive security practice.', recommendation: 'Good practice! Keep security.txt updated with current contact information.' }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeUrl(url) {
  const u = url.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) return 'https://' + u;
  return u;
}

function extractHostname(url) {
  try { return new URL(normalizeUrl(url)).hostname; } catch { return url; }
}

function stripUrl(url) {
  return url.replace(/\/$/, '');
}

async function httpGet(url, opts = {}) {
  try {
    return await axios({
      url,
      method: 'GET',
      timeout: opts.timeout || 8000,
      maxRedirects: opts.maxRedirects !== undefined ? opts.maxRedirects : 5,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Scantinel/2.0; Security-Audit)',
        ...opts.headers
      },
      ...opts
    });
  } catch {
    return null;
  }
}

async function checkPort(host, port, timeout = 1800) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(timeout);
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('error', () => resolve(false));
    sock.on('timeout', () => { sock.destroy(); resolve(false); });
    sock.connect(port, host);
  });
}

function riskToSeverity(risk) {
  return { critical: 'critical', high: 'high', medium: 'medium', low: 'low', safe: 'info', unknown: 'info' }[risk] || 'info';
}

function calcGrade(score) {
  if (score >= 90) return { grade: 'A', level: 'Excellent' };
  if (score >= 75) return { grade: 'B', level: 'Good' };
  if (score >= 60) return { grade: 'C', level: 'Fair' };
  if (score >= 40) return { grade: 'D', level: 'Poor' };
  return { grade: 'F', level: 'Critical' };
}

// Helper to format recommendations into a readable multi-line string.
function formatRecommendation(rec) {
  if (!rec && rec !== 0) return '';
  // If an array of lines/blocks is provided, join with a blank line between blocks.
  if (Array.isArray(rec)) {
    return rec.map(r => String(r).trim()).filter(Boolean).join('\n\n');
  }
  // Otherwise coerce to string and tidy up spacing and newlines.
  let s = String(rec).trim();
  s = s.replace(/\r\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  s = s.replace(/\t+/g, '  ');
  return s;
}

// Heuristically expand short/plain recommendations into a more structured, user-friendly format.
function enhanceRecommendation(rec, ctx = {}) {
  if (!rec) return rec;
  if (Array.isArray(rec)) return rec; // already structured
  const s = String(rec).trim();
  // If already multi-line or long, don't attempt to enrich
  if (s.includes('\n') || s.length > 240) return s;

  const parts = s.split(/\.\s+/);
  const summary = parts[0].replace(/\.$/, '');

  const steps = [];
  // Heuristics for common actions
  const lowered = s.toLowerCase();
  if (lowered.includes('block port') || lowered.includes('block port') || lowered.includes('block')) {
    steps.push('Identify the network boundary or firewall controlling incoming traffic.');
    steps.push('Create a firewall rule to block the specific port (example commands below).');
    steps.push('Verify the port is closed from an external network and monitor for related traffic.');
  } else if (lowered.includes('enable') && (lowered.includes('hsts') || lowered.includes('strict-transport-security') || lowered.includes('https'))) {
    steps.push('Install or renew a TLS certificate (Let\'s Encrypt is a free option).');
    steps.push('Configure your web server to redirect HTTP → HTTPS and add the HSTS header.');
    steps.push('Test redirects and header presence from multiple locations.');
  } else if (lowered.includes('content-security-policy') || lowered.includes('csp')) {
    steps.push('Start with a restrictive CSP: default-src \'self\'; script-src \'self\';');
    steps.push('Allowlist any external domains you explicitly use (CDNs, analytics).');
    steps.push('Deploy in report-only mode first to tune the policy.');
  } else if (lowered.includes('remove') || lowered.includes('delete') || lowered.includes('remove .env')) {
    steps.push('Immediately remove the sensitive file from the web root.');
    steps.push('Ensure the file is included in .gitignore and rotate any credentials found.');
    steps.push('Move secrets to environment variables or a secrets manager.');
  } else {
    steps.push('Review the recommendation and identify the responsible system (web server, firewall, application).');
    steps.push('Apply the recommended change in a staging environment first.');
    steps.push('Deploy to production and verify the change with a follow-up scan.');
  }

  // Examples based on keywords
  const examples = [];
  if (lowered.includes('block') || lowered.match(/port\s+\d+/)) {
    examples.push('UFW (Ubuntu): sudo ufw deny 445/tcp');
    examples.push('iptables: sudo iptables -A INPUT -p tcp --dport 445 -j DROP');
  }
  if (lowered.includes('.git')) {
    examples.push('Nginx: location ~ /\\.git { deny all; }');
  }
  if (lowered.includes('let\'s encrypt') || lowered.includes('certbot') || lowered.includes('https')) {
    examples.push('Certbot (nginx): sudo certbot --nginx -d yourdomain.com');
  }

  const difficulty = (ctx.severity === 'critical' || ctx.severity === 'high') ? 'High' : (ctx.severity === 'medium' ? 'Medium' : 'Low');
  const est = difficulty === 'High' ? '30-120 minutes' : (difficulty === 'Medium' ? '15-60 minutes' : '5-30 minutes');

  const out = [];
  out.push(`Summary: ${summary}`);
  out.push('Steps:');
  steps.forEach((st, i) => out.push(`${i + 1}. ${st}`));
  if (examples.length) {
    out.push('Example commands:');
    examples.forEach(cmd => out.push(cmd));
  }
  out.push(`Difficulty: ${difficulty}`);
  out.push(`Estimated time: ${est}`);
  out.push('Tip: Test changes in staging and monitor after deployment.');

  return out.join('\n\n');
}

// ─── Main scanner ─────────────────────────────────────────────────────────────
async function runScan(scanRecord, onProgress) {
  const findings = [];
  const targetUrl = normalizeUrl(scanRecord.url);
  const hostname  = extractHostname(scanRecord.url);
  const base      = stripUrl(targetUrl);
  const openPorts = [];
  const technologies = new Set();

  // Helper to add a finding. Automatically formats recommendation text/arrays.
  const addFinding = (data) => {
    const entry = { ...data };
    if (entry && entry.recommendation !== undefined) {
      try {
        if (typeof entry.recommendation === 'string') {
          entry.recommendation = enhanceRecommendation(entry.recommendation, { severity: entry.severity });
        }
        entry.recommendation = formatRecommendation(entry.recommendation);
      } catch (e) {
        // If formatting fails, keep original value
      }
    }
    findings.push({ id: uuidv4(), ...entry });
  };

  // ── Phase 1: Initial HTTP fetch ────────────────────────────────────────────
  await onProgress(5, 'Connecting to target server...', 'Reconnaissance');

  const mainRes = await httpGet(targetUrl);
  const httpRes = !mainRes ? await httpGet('http://' + hostname) : null;
  const resp = mainRes || httpRes;

  if (!resp) throw new Error(`Cannot reach ${scanRecord.url}. Verify the URL is correct and the site is online.`);

  const headers = resp.headers || {};
  const rawHeaders = {};
  Object.keys(headers).forEach(k => { rawHeaders[k.toLowerCase()] = headers[k]; });

  // Detect technologies from response headers
  const server = rawHeaders['server'] || '';
  const poweredBy = rawHeaders['x-powered-by'] || '';
  const generator = rawHeaders['x-generator'] || '';
  if (server) technologies.add(server.split('/')[0]);
  if (poweredBy) technologies.add(poweredBy);
  if (generator) technologies.add(generator);

  // Detect from body
  const body = typeof resp.data === 'string' ? resp.data : '';
  if (body.includes('wp-content/') || body.includes('wp-includes/')) technologies.add('WordPress');
  if (body.includes('Joomla')) technologies.add('Joomla');
  if (body.includes('Drupal')) technologies.add('Drupal');
  if (body.includes('React') || body.includes('__NEXT_DATA__')) technologies.add('React/Next.js');
  if (body.includes('vue')) technologies.add('Vue.js');
  if (body.includes('Angular')) technologies.add('Angular');
  if (body.includes('Laravel')) technologies.add('Laravel');
  if (body.includes('Django')) technologies.add('Django');

  await onProgress(12, 'Analyzing security response headers...', 'Header Analysis');

  // ── Phase 2: Security headers ─────────────────────────────────────────────
  const headerChecks = [
    {
      key: 'strict-transport-security',
      severity: 'high', cvss: 7.4, cwe: 'CWE-319',
      title: 'HTTPS Not Enforced (HSTS Missing)',
      description: 'Your site lacks HTTP Strict Transport Security. Browsers won\'t automatically force HTTPS connections, leaving visitors vulnerable to downgrade attacks where an attacker intercepts the connection before HTTPS is established.',
      impact: 'Man-in-the-middle attacks, session hijacking on public Wi-Fi.',
      recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload — This tells browsers to always use HTTPS for the next year.'
    },
    {
      key: 'content-security-policy',
      severity: 'medium', cvss: 6.1, cwe: 'CWE-79',
      title: 'Content Security Policy (CSP) Not Set',
      description: 'Without CSP, your site is vulnerable to Cross-Site Scripting (XSS) attacks. Malicious scripts can be injected and run in your visitors\' browsers, stealing session cookies, passwords, and personal data.',
      impact: 'XSS attacks can steal user sessions, credentials, and personal data.',
      recommendation: 'Start with: Content-Security-Policy: default-src \'self\'; script-src \'self\' — Then customize for your CDN/analytics needs.'
    },
    {
      key: 'x-frame-options',
      severity: 'medium', cvss: 5.4, cwe: 'CWE-1021',
      title: 'Clickjacking Protection Missing',
      description: 'Your website can be embedded inside an invisible iframe on a malicious website. Attackers overlay fake buttons to trick users into performing actions like making purchases or changing account settings without knowing.',
      impact: 'Clickjacking attacks stealing user actions and data.',
      recommendation: 'Add: X-Frame-Options: DENY (or SAMEORIGIN if you embed your own pages in iframes).'
    },
    {
      key: 'x-content-type-options',
      severity: 'low', cvss: 4.3, cwe: 'CWE-116',
      title: 'MIME Type Sniffing Not Prevented',
      description: 'Without this header, browsers try to "guess" file types. Attackers can upload files with misleading extensions (e.g., an image that\'s actually JavaScript) that browsers will execute.',
      impact: 'MIME confusion attacks enabling script execution.',
      recommendation: 'Add: X-Content-Type-Options: nosniff — Simple one-liner that prevents this class of attack.'
    },
    {
      key: 'referrer-policy',
      severity: 'low', cvss: 3.7, cwe: 'CWE-200',
      title: 'Referrer Information Leaking to Third Parties',
      description: 'When users click links on your site, the full URL (including any sensitive parameters like user IDs or session tokens) is sent to the destination website in the HTTP Referer header.',
      impact: 'Privacy leak of URL structure and user data to external sites.',
      recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin — Sends only the origin, not full URL, to external sites.'
    },
    {
      key: 'permissions-policy',
      severity: 'low', cvss: 3.5, cwe: 'CWE-284',
      title: 'Browser Feature Permissions Unrestricted',
      description: 'Your site hasn\'t restricted browser features like camera, microphone, geolocation, and USB. Malicious third-party scripts on your page could silently request these permissions.',
      impact: 'Malicious scripts could abuse device features.',
      recommendation: 'Add: Permissions-Policy: camera=(), microphone=(), geolocation=() — Disables features your site doesn\'t need.'
    },
    {
      key: 'cross-origin-embedder-policy',
      severity: 'info', cvss: 2.5, cwe: 'CWE-829',
      title: 'Cross-Origin Isolation Not Configured',
      description: 'COEP is not set. This prevents enabling cross-origin isolation which protects against Spectre-style side-channel attacks.',
      impact: 'Side-channel memory attacks in shared environments.',
      recommendation: 'Add: Cross-Origin-Embedder-Policy: require-corp for high-security applications.'
    }
  ];

  for (const check of headerChecks) {
    if (!rawHeaders[check.key]) {
      addFinding({ severity: check.severity, category: 'Security Headers', cvss: check.cvss, cwe: check.cwe, title: check.title, description: check.description, impact: check.impact, recommendation: check.recommendation, evidence: `Header "${check.key}" not found in server response` });
    }
  }

  await onProgress(22, 'Verifying SSL/TLS configuration...', 'Encryption');

  // ── Phase 3: HTTPS/TLS ────────────────────────────────────────────────────
  const isHttps = targetUrl.startsWith('https://');
  if (!isHttps) {
    addFinding({ severity: 'critical', category: 'Encryption', cvss: 9.1, cwe: 'CWE-319', title: 'Site Not Using HTTPS Encryption', description: 'Your website transmits all data — including passwords, personal information, and session tokens — in plain text over HTTP. Anyone on the same network (coffee shops, offices, ISPs) can read or modify this data.', impact: 'All user data, passwords, and sessions are exposed to interception.', recommendation: 'Install a free TLS certificate via Let\'s Encrypt (certbot). Redirect all HTTP traffic to HTTPS. Update all internal links to https://.' });
  } else {
    const httpFallback = await httpGet(`http://${hostname}`, { maxRedirects: 0 });
    if (httpFallback) {
      const loc = (httpFallback.headers['location'] || '').toLowerCase();
      if (httpFallback.status < 300 || httpFallback.status >= 400 || !loc.startsWith('https')) {
        addFinding({ severity: 'medium', category: 'Encryption', cvss: 5.9, cwe: 'CWE-319', title: 'HTTP Version Accessible Without Redirect', description: 'While HTTPS works, users who visit http:// are not automatically redirected to the secure version. First-time visitors or bookmarks using HTTP are unprotected.', impact: 'Users connecting via HTTP are not protected.', recommendation: 'Configure a permanent 301 redirect from all HTTP URLs to HTTPS at the web server level.' });
      }
    }
    if (!rawHeaders['strict-transport-security']) {
      // Already caught above in header checks
    }
  }

  await onProgress(33, 'Scanning for information disclosure...', 'Information Leakage');

  // ── Phase 4: Info disclosure ───────────────────────────────────────────────
  if (server && /[\d.]/.test(server)) {
    addFinding({ severity: 'low', category: 'Information Disclosure', cvss: 4.3, cwe: 'CWE-200', title: 'Web Server Version Exposed', description: `Your server reveals its software and version number (${server}). Attackers use this to look up CVEs and known exploits for that specific version — reducing the effort needed to find an attack vector.`, impact: 'Targeted version-specific exploitation.', recommendation: 'Hide version info. In Nginx: server_tokens off; — In Apache: ServerTokens Prod; ServerSignature Off;', evidence: `Server: ${server}` });
  }
  if (poweredBy) {
    addFinding({ severity: 'low', category: 'Information Disclosure', cvss: 4.3, cwe: 'CWE-200', title: 'Backend Technology Stack Disclosed', description: `Your site reveals what it's built with via the X-Powered-By header (${poweredBy}). This helps attackers identify which framework vulnerabilities or default configurations to target.`, impact: 'Framework-specific attack targeting.', recommendation: 'Remove the X-Powered-By header. In Express.js: app.disable("x-powered-by"); — In PHP: expose_php = Off in php.ini', evidence: `X-Powered-By: ${poweredBy}` });
  }

  // Check for debug/error pages
  const randomPath = `/this-path-should-not-exist-${Date.now()}`;
  const errorRes = await httpGet(base + randomPath);
  if (errorRes && errorRes.status === 500) {
    addFinding({ severity: 'medium', category: 'Information Disclosure', cvss: 5.3, cwe: 'CWE-209', title: 'Verbose Error Pages Enabled', description: 'Your server returns detailed error messages (500 errors) which may expose stack traces, file paths, database errors, or framework version information.', impact: 'Internal system details exposed to attackers.', recommendation: 'Configure custom error pages. Disable debug mode in production. Ensure error messages show generic user-friendly text only.' });
  }

  await onProgress(44, 'Checking cookie security flags...', 'Cookie Security');

  // ── Phase 5: Cookie security ──────────────────────────────────────────────
  const setCookie = resp.headers['set-cookie'];
  if (setCookie) {
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    const noSecure   = cookies.some(c => !c.toLowerCase().includes('; secure'));
    const noHttpOnly = cookies.some(c => !c.toLowerCase().includes('httponly'));
    const noSameSite = cookies.some(c => !c.toLowerCase().includes('samesite'));

    if (noSecure && isHttps) {
      addFinding({ severity: 'medium', category: 'Cookie Security', cvss: 5.9, cwe: 'CWE-614', title: 'Session Cookies Missing "Secure" Flag', description: 'Cookies are being set without the Secure flag. On HTTPS sites, cookies can still be transmitted over HTTP if the Secure flag is absent, making them vulnerable to interception.', impact: 'Session cookie theft via HTTP interception.', recommendation: 'Set Secure flag on all sensitive cookies: Set-Cookie: session=value; Secure; HttpOnly; SameSite=Lax', evidence: 'Cookie missing Secure attribute' });
    }
    if (noHttpOnly) {
      addFinding({ severity: 'medium', category: 'Cookie Security', cvss: 6.1, cwe: 'CWE-1004', title: 'Cookies Accessible via JavaScript (HttpOnly Missing)', description: 'Session cookies without the HttpOnly flag can be read by JavaScript. If your site has any XSS vulnerability, attackers can steal these cookies to hijack user sessions.', impact: 'Session hijacking via XSS cookie theft.', recommendation: 'Add HttpOnly to all session cookies: Set-Cookie: session=value; HttpOnly; Secure; SameSite=Lax', evidence: 'Cookie missing HttpOnly attribute' });
    }
    if (noSameSite) {
      addFinding({ severity: 'low', category: 'Cookie Security', cvss: 4.3, cwe: 'CWE-352', title: 'Cookies Vulnerable to CSRF Attacks', description: 'Cookies without the SameSite attribute can be sent with cross-site requests. Attackers on other websites can trick your users\' browsers into making authenticated requests.', impact: 'Cross-Site Request Forgery (CSRF) attacks.', recommendation: 'Add SameSite=Lax to cookies. Use Strict for highest security. Implement CSRF tokens for forms.', evidence: 'Cookie missing SameSite attribute' });
    }
  }

  // ── Phase 6: CORS ──────────────────────────────────────────────────────────
  await onProgress(52, 'Testing CORS and access control policies...', 'Access Control');
  const corsHeader = rawHeaders['access-control-allow-origin'];
  if (corsHeader === '*') {
    addFinding({ severity: 'medium', category: 'Access Control', cvss: 6.5, cwe: 'CWE-942', title: 'Wildcard CORS Policy Enabled', description: 'Your server allows any website (Access-Control-Allow-Origin: *) to make cross-origin requests to your APIs. Malicious websites can silently request your API endpoints on behalf of logged-in users.', impact: 'Data exfiltration from authenticated API endpoints.', recommendation: 'Replace the wildcard with specific allowed origins: Access-Control-Allow-Origin: https://yourdomain.com', evidence: `Access-Control-Allow-Origin: ${corsHeader}` });
  }

  const acAllowCreds = rawHeaders['access-control-allow-credentials'];
  if (acAllowCreds === 'true' && corsHeader === '*') {
    addFinding({ severity: 'high', category: 'Access Control', cvss: 8.1, cwe: 'CWE-942', title: 'Dangerous CORS Misconfiguration (Credentials + Wildcard)', description: 'Your API allows credentials (cookies/auth tokens) with a wildcard origin. This is a critical misconfiguration — any website can make authenticated requests to your API as your users.', impact: 'Complete authentication bypass from any website.', recommendation: 'You cannot use credentials with wildcard origin. Specify exact allowed origins and never use * with credentials.' });
  }

  // ── Phase 7: Sensitive files ───────────────────────────────────────────────
  await onProgress(60, 'Scanning for exposed sensitive files and endpoints...', 'Exposed Resources');

  const pathResults = await Promise.allSettled(
    SENSITIVE_PATHS.map(async (sp) => {
      const res = await httpGet(base + sp.path, { timeout: 5000 });
      return { sp, res };
    })
  );

  for (const result of pathResults) {
    if (result.status !== 'fulfilled') continue;
    const { sp, res } = result.value;
    if (!res) continue;
    if (res.status === 200 || res.status === 206) {
      addFinding({ severity: sp.severity, category: 'Exposed Resources', cvss: sp.cvss || 5.0, cwe: sp.cwe || 'CWE-200', title: sp.title, description: sp.description, impact: sp.impact, recommendation: sp.recommendation, evidence: `GET ${sp.path} → HTTP ${res.status}` });
    }
  }

  // ── Phase 8: Port scanning ─────────────────────────────────────────────────
  await onProgress(72, 'Scanning network ports and services...', 'Port Scanning');

  const portList = Object.keys(PORT_MAP).map(Number);
  const batchSize = 6;
  for (let i = 0; i < portList.length; i += batchSize) {
    const batch = portList.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(async (port) => {
      const open = await checkPort(hostname, port);
      return { port, open };
    }));
    for (const { port, open } of results) {
      if (open) {
        const info = PORT_MAP[port];
        openPorts.push({ port, service: info.service, state: 'open', protocol: 'tcp', risk: info.risk });
        if (RISKY_PORT_FINDINGS[port]) {
          const rf = RISKY_PORT_FINDINGS[port];
          addFinding({ severity: rf.severity, category: 'Network Security', cvss: rf.cvss, cwe: rf.cwe, title: rf.title, description: rf.description, impact: rf.impact, recommendation: rf.recommendation, port, service: info.service, evidence: `Port ${port}/${info.service} is open and accepting connections` });
        }
      }
    }
    const portProg = 72 + Math.round(((i + batchSize) / portList.length) * 15);
    await onProgress(Math.min(portProg, 87), `Scanning ports (${Math.min(i + batchSize, portList.length)}/${portList.length})...`, 'Port Scanning');
  }

  // ── Phase 9: Mixed content ────────────────────────────────────────────────
  await onProgress(88, 'Analyzing content and form security...', 'Content Security');

  if (isHttps && body) {
    const mixedRx = /src\s*=\s*["']http:\/\//i;
    const mixedLinkRx = /href\s*=\s*["']http:\/\//i;
    if (mixedRx.test(body) || mixedLinkRx.test(body)) {
      addFinding({ severity: 'medium', category: 'Content Security', cvss: 5.4, cwe: 'CWE-319', title: 'Mixed Content Detected (HTTP Resources on HTTPS Page)', description: 'Your HTTPS page loads some resources (scripts, images, stylesheets) over HTTP. Browsers block these "mixed content" requests, breaking your site, and the HTTP requests are vulnerable to interception.', impact: 'Broken site functionality, potential script injection via HTTP.', recommendation: 'Update all resource URLs to use https:// or protocol-relative URLs (//). Check CDN and image URLs especially.' });
    }
  }

  // Check for forms without CSRF (basic check)
  if (body && body.includes('<form') && !body.includes('csrf') && !body.includes('_token')) {
    addFinding({ severity: 'medium', category: 'Content Security', cvss: 6.5, cwe: 'CWE-352', title: 'Forms May Lack CSRF Protection', description: 'Forms were detected on the page but no CSRF token was found. Without Cross-Site Request Forgery protection, attackers can trick users into submitting forms without their knowledge.', impact: 'Unauthorized actions performed as authenticated users.', recommendation: 'Implement CSRF tokens in all forms. Most frameworks (Django, Laravel, Rails, Express) have built-in CSRF middleware — ensure it is enabled.' });
  }

  // ── Phase 10: Calculate score ─────────────────────────────────────────────
  await onProgress(95, 'Calculating security risk score...', 'Risk Assessment');

  const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: findings.length };
  let scoreDeduction = 0;

  for (const f of findings) {
    summary[f.severity] = (summary[f.severity] || 0) + 1;
    const deduct = { critical: 35, high: 20, medium: 10, low: 4, info: 0 };
    scoreDeduction += deduct[f.severity] || 0;
  }

  const riskScore = Math.max(0, 100 - scoreDeduction);
  const { grade, level } = calcGrade(riskScore);
  summary.riskScore = riskScore;
  summary.grade = grade;
  summary.riskLevel = level;

  await onProgress(100, 'Scan complete', 'Complete');

  return { findings, openPorts, technologies: [...technologies].filter(Boolean), headers: rawHeaders, summary };
}

module.exports = { runScan, normalizeUrl, extractHostname };
