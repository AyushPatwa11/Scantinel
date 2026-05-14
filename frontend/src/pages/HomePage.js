import React, { useState, useEffect, useRef, useCallback } from 'react';
import { startScan, getScans, deleteScan } from '../utils/api';
import { GRADE_META, formatDate } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import {
  Shield, Search, Globe, ChevronRight, Trash2,
  Activity, Clock, AlertTriangle, CheckCircle, Zap,
  Lock, Eye, Server, FileWarning, Wifi, Menu, X, ArrowRight,
  Network, Target, Code2, BarChart2, ShieldCheck, LayoutDashboard,
  Users, Cpu, Database, Layers, Terminal, ArrowDown, GitBranch,
  History, TrendingUp, ExternalLink
} from 'lucide-react';
import './HomePage.css';

const INTRO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_155101_f2540600-6fe9-433e-8e48-b3f4b72f0727.mp4';

const NAV_ITEMS = [
  { label: 'Platform',     href: '#platform'     },
  { label: 'How it works', href: '#how-it-works'  },
  { label: 'AI Defense',   href: '#ai-defense'   },
  { label: 'Connections',  href: '#connections'  },
  { label: 'Insights',     href: '#insights'     },
];

const PLATFORM_FEATURES = [
  { icon: LayoutDashboard, title: 'Clean Dashboard',       desc: 'Visual overview of all findings sorted by severity — no configuration needed.' },
  { icon: BarChart2,       title: 'Risk Classification',   desc: 'Every issue graded Critical, High, Medium, or Low for clear prioritization.' },
  { icon: ShieldCheck,     title: 'Fix Recommendations',   desc: 'Actionable, step-by-step remediation guidance for every detected vulnerability.' },
  { icon: Users,           title: 'Beginner Friendly',     desc: 'No cybersecurity expertise needed. Every finding explained in plain language.' },
];

const WORKFLOW_STEPS = [
  { num: '01', label: 'User Input',          desc: 'Enter a target URL',                          icon: Globe          },
  { num: '02', label: 'Port Scanning',       desc: 'Nmap maps open ports & services',             icon: Network        },
  { num: '03', label: 'Vuln Scanning',       desc: 'Nikto detects web misconfigurations',         icon: Target         },
  { num: '04', label: 'Result Parsing',      desc: 'Raw output structured & normalised',          icon: Code2          },
  { num: '05', label: 'Classification',      desc: 'Issues graded Critical / High / Med / Low',   icon: BarChart2      },
  { num: '06', label: 'Fix Guidance',        desc: 'Plain-English remediation generated',         icon: ShieldCheck    },
  { num: '07', label: 'Dashboard Report',    desc: 'Full report ready to review & export',        icon: LayoutDashboard},
];

const AI_CAPABILITIES = [
  { icon: Zap,           text: 'Converts raw scanner output into plain English explanations' },
  { icon: ShieldCheck,   text: 'Generates step-by-step, contextual fix recommendations'     },
  { icon: AlertTriangle, text: 'Explains why each vulnerability is dangerous to your users'  },
  { icon: Eye,           text: 'Provides impact analysis and remediation priority scoring'   },
];

const CONNECTIONS = [
  { name: 'Nmap',    role: 'Network & Port Scanning',    color: '#5b73ff', icon: Network        },
  { name: 'Nikto',   role: 'Web Vulnerability Detection', color: '#ff3a5c', icon: Target         },
  { name: 'Node.js', role: 'Backend API Processing',     color: '#36d4b7', icon: Server         },
  { name: 'Express', role: 'REST API Layer',              color: '#f5a623', icon: Layers         },
  { name: 'React',   role: 'Frontend Dashboard',         color: '#5b73ff', icon: Code2          },
  { name: 'MongoDB', role: 'Scan Data Storage',          color: '#36d4b7', icon: Database       },
];

const SAMPLE_INSIGHTS = [
  { severity: 'critical', title: 'Telnet Service Exposed',         desc: 'Port 23 is open and running Telnet — an unencrypted protocol transmitting credentials in plain text.',         fix: 'Disable Telnet and replace with SSH (port 22) with key-based auth.' },
  { severity: 'high',     title: 'Missing X-Frame-Options Header', desc: 'Your site lacks clickjacking protection, allowing attackers to embed it in hidden iframes.',                  fix: 'Add X-Frame-Options: DENY to your HTTP response headers.'           },
  { severity: 'medium',   title: 'Outdated Apache 2.2.x Detected', desc: 'Your web server runs an end-of-life version with known unpatched CVEs exploitable remotely.',               fix: 'Upgrade to Apache 2.4.x and enable automatic security updates.'      },
  { severity: 'low',      title: 'Directory Listing Enabled',      desc: 'Server exposes directory contents publicly, leaking your file structure and sensitive paths to anyone.',      fix: 'Add Options -Indexes to your server config to disable listing.'     },
];

const FEATURES = [
  { icon: Lock,        label: 'SSL / TLS Verification'   },
  { icon: Shield,      label: 'Security Header Analysis'  },
  { icon: Eye,         label: 'Sensitive File Detection'  },
  { icon: Server,      label: 'Open Port Scanning'        },
  { icon: FileWarning, label: 'Cookie Security Audit'     },
  { icon: Wifi,        label: 'CORS Policy Analysis'      },
  { icon: Activity,    label: 'Information Leakage Check' },
  { icon: Zap,         label: 'Risk Scoring & Grading'   },
];

const SCAN_PHASES = [
  'Reconnaissance', 'Header Analysis', 'Encryption', 'Information Leakage',
  'Cookie Security', 'Access Control', 'Exposed Resources', 'Port Scanning',
  'Content Security', 'Risk Assessment',
];

/* ─── Intro Video Splash ───────────────────────────────────────────────────── */
function IntroSplash({ onDone }) {
  const videoRef            = useRef(null);
  const [fading, setFading] = useState(false);
  const [logoIn, setLogoIn] = useState(false);

  // Show logo shortly after the video starts
  useEffect(() => {
    const t = setTimeout(() => setLogoIn(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Video ends → start zoom + fade exit
  function handleEnded() { setFading(true); }

  // Once the opacity transition completes → unmount
  function handleTransitionEnd(e) {
    if (fading && e.propertyName === 'opacity') onDone();
  }

  // Fallback if video fails to load
  function handleError() { setFading(true); }

  return (
    <div
      className={`intro-splash ${fading ? 'intro-splash--fading' : ''}`}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Video — zooms in on exit */}
      <video
        ref={videoRef}
        className={`intro-video ${fading ? 'intro-video--zoom' : ''}`}
        src={INTRO_VIDEO}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        onError={handleError}
      />

      {/* ── Animated Logo Overlay ── */}
      <div className={`intro-logo ${logoIn ? 'intro-logo--visible' : ''}`}>
        {/* Icon with glow rings */}
        <div className="intro-logo-icon-wrap">
          <div className="intro-logo-ring intro-logo-ring-1" />
          <div className="intro-logo-ring intro-logo-ring-2" />
          <div className="intro-logo-icon-bg">
            <Shield size={34} strokeWidth={1.4} />
          </div>
        </div>

        {/* Text */}
        <div className="intro-logo-text">
          <span className="intro-logo-name">Scantinel</span>
          <span className="intro-logo-tagline">Security Intelligence Platform</span>
        </div>

        {/* Scanning line that sweeps across the logo */}
        <div className="intro-logo-scan-line" />
      </div>

      {/* Skip button */}
      <button className="intro-skip-btn" onClick={() => setFading(true)}>
        Skip intro ↓
      </button>
    </div>
  );
}


/* ─── Hamburger Button ─────────────────────────────────────────────────────── */
function HamburgerButton({ open, onClick }) {
  return (
    <button
      onClick={onClick}
      className="hamburger-btn"
      style={{ backgroundColor: open ? 'rgba(255,255,255,0.08)' : 'transparent' }}
      aria-label="Toggle menu"
    >
      <span className="hamburger-icon" style={{
        opacity: open ? 0 : 1,
        transform: open ? 'rotate(-90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
      }}>
        <Menu size={20} color="white" strokeWidth={1.5} />
      </span>
      <span className="hamburger-icon" style={{
        opacity: open ? 1 : 0,
        transform: open ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
      }}>
        <X size={20} color="white" strokeWidth={1.5} />
      </span>
    </button>
  );
}

/* ─── Mobile Menu ──────────────────────────────────────────────────────────── */
function MobileMenu({ open, onClose, onFocusScan }) {
  return (
    <>
      <div
        className="mobile-backdrop"
        style={{
          backdropFilter: open ? 'blur(12px)' : 'blur(0px)',
          backgroundColor: open ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
      />
      <div
        className="mobile-panel"
        style={{ maxHeight: open ? '480px' : '0px' }}
      >
        <div className="mobile-panel-inner">
          <div className="mobile-nav-links">
            {NAV_ITEMS.map((item, i) => (
              <a
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="mobile-nav-link"
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(-8px)',
                  transition: `opacity 0.4s cubic-bezier(0.23,1,0.32,1) ${i * 50 + 80}ms, transform 0.4s cubic-bezier(0.23,1,0.32,1) ${i * 50 + 80}ms, color 0.2s, background 0.2s`,
                }}
              >
                {item.label}
                <ArrowRight size={14} className="mobile-nav-arrow" />
              </a>
            ))}
          </div>
          <div
            className="mobile-cta-wrap"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-8px)',
              transition: `opacity 0.4s cubic-bezier(0.23,1,0.32,1) 360ms, transform 0.4s cubic-bezier(0.23,1,0.32,1) 360ms`,
            }}
          >
            <button
              className="mobile-cta-btn"
              onClick={() => { onClose(); onFocusScan(); }}
            >
              <Search size={14} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Scan a URL
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── History Analysis Panel ────────────────────────────────────────────────── */
function HistoryPanel({ open, onClose, onScanOpen }) {
  const [scans, setScans]     = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef              = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getScans(6)
      .then(setScans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const completedCount = scans.filter(s => s.status === 'completed').length;
  const runningCount   = scans.filter(s => s.status === 'running').length;

  return (
    <div
      ref={panelRef}
      className={`history-panel ${open ? 'history-panel--open' : ''}`}
    >
      {/* Panel header */}
      <div className="hp-header">
        <div className="hp-header-left">
          <div className="hp-header-icon"><TrendingUp size={14} /></div>
          <div>
            <div className="hp-title">History Analysis</div>
            <div className="hp-subtitle">Your recent security scans</div>
          </div>
        </div>
        <button className="hp-close" onClick={onClose}><X size={14} /></button>
      </div>

      {/* Quick stats */}
      <div className="hp-stats">
        <div className="hp-stat">
          <span className="hp-stat-num">{scans.length}</span>
          <span className="hp-stat-label">Total</span>
        </div>
        <div className="hp-stat-sep" />
        <div className="hp-stat">
          <span className="hp-stat-num" style={{ color: 'var(--safe)' }}>{completedCount}</span>
          <span className="hp-stat-label">Done</span>
        </div>
        <div className="hp-stat-sep" />
        <div className="hp-stat">
          <span className="hp-stat-num" style={{ color: 'var(--accent)' }}>{runningCount}</span>
          <span className="hp-stat-label">Live</span>
        </div>
      </div>

      {/* Scan list */}
      <div className="hp-list">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="hp-skeleton" />)
        ) : scans.length === 0 ? (
          <div className="hp-empty">
            <Shield size={22} />
            <span>No scans yet. Start your first scan!</span>
          </div>
        ) : (
          scans.map((scan) => {
            const gm = GRADE_META[scan.summary?.grade] || {};
            return (
              <button
                key={scan.scanId}
                className="hp-item"
                onClick={() => { onScanOpen(scan.scanId); onClose(); }}
              >
                <div className="hp-item-left">
                  <div className="hp-item-url">{scan.url}</div>
                  <div className="hp-item-meta">
                    <span className={`hp-dot hp-dot-${scan.status}`} />
                    <span className="hp-item-status">{scan.status}</span>
                    <span className="hp-item-date">{formatDate(scan.createdAt)}</span>
                  </div>
                </div>
                <div className="hp-item-right">
                  {scan.summary?.grade && (
                    <span className="hp-grade" style={{ color: gm.color }}>
                      {scan.summary.grade}
                    </span>
                  )}
                  <ExternalLink size={11} className="hp-item-arrow" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="hp-footer">
        <button className="hp-footer-btn" onClick={onClose}>
          <Search size={12} /> New Scan
        </button>
      </div>
    </div>
  );
}

/* ─── Navbar ───────────────────────────────────────────────────────────────── */
function Navbar({ onFocusScan, onScanStart }) {
  const [open, setOpen]           = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [histOpen, setHistOpen]   = useState(false);
  const histBtnRef                = useRef(null);

  useEffect(() => {
    const onKey    = (e) => { if (e.key === 'Escape') { setOpen(false); setHistOpen(false); } };
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const closeHist = useCallback(() => setHistOpen(false), []);

  return (
    <>
      <nav className={`home-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div 
          className="nav-brand" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-icon"><Shield size={15} /></div>
          <span className="brand-name">Scantinel</span>
        </div>

        <div className="nav-desktop-links">
          {NAV_ITEMS.map((item) => (
            <a key={item.label} href={item.href} className="nav-desktop-link">{item.label}</a>
          ))}
        </div>

        <div className="nav-right">
          {/* History Analysis Button */}
          <div className="nav-history-wrap" ref={histBtnRef}>
            <button
              id="history-analysis-btn"
              className={`nav-history-btn ${histOpen ? 'nav-history-btn--active' : ''}`}
              onClick={() => setHistOpen((v) => !v)}
              title="History Analysis"
            >
              <span className="nav-hist-pulse" />
              <History size={14} />
              <span className="nav-hist-label">History</span>
            </button>
            <HistoryPanel
              open={histOpen}
              onClose={closeHist}
              onScanOpen={onScanStart}
              onFocusScan={onFocusScan}
            />
          </div>

          <HamburgerButton open={open} onClick={() => setOpen((v) => !v)} />
          <button className="nav-cta-btn" onClick={onFocusScan}>
            <Search size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Scan a URL
          </button>
        </div>
      </nav>
      <MobileMenu open={open} onClose={() => setOpen(false)} onFocusScan={onFocusScan} />
    </>
  );
}

/* ─── Status Badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    completed: { color: 'var(--safe)',   icon: CheckCircle,   label: 'Completed' },
    running:   { color: 'var(--accent)', icon: Activity,      label: 'Running'   },
    failed:    { color: 'var(--crit)',   icon: AlertTriangle, label: 'Failed'    },
    queued:    { color: 'var(--text-3)', icon: Clock,         label: 'Queued'    },
  }[status] || { color: 'var(--text-3)', icon: Clock, label: status };
  const Icon = cfg.icon;
  return (
    <span className="status-badge" style={{ color: cfg.color, background: `${cfg.color}18` }}>
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

/* ─── Scan Mini Summary ────────────────────────────────────────────────────── */
function ScanMiniSummary({ summary }) {
  if (!summary) return null;
  const gm = GRADE_META[summary.grade] || {};
  return (
    <div className="mini-summary">
      {summary.critical > 0 && <span className="mini-pill mini-crit">{summary.critical}C</span>}
      {summary.high     > 0 && <span className="mini-pill mini-high">{summary.high}H</span>}
      {summary.medium   > 0 && <span className="mini-pill mini-med">{summary.medium}M</span>}
      {summary.low      > 0 && <span className="mini-pill mini-low">{summary.low}L</span>}
      <span className="mini-grade" style={{ color: gm.color }}>{summary.grade}</span>
    </div>
  );
}

/* ─── HomePage ─────────────────────────────────────────────────────────────── */
let hasPlayedIntro = false;

export default function HomePage({ onScanStart }) {
  const [introDone, setIntroDone]           = useState(hasPlayedIntro);
  const [url, setUrl]                       = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState('');
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [deletingId, setDeletingId]         = useState(null);
  const { toast }                           = useToast();
  const inputRef                            = useRef(null);

  function focusScanInput() {
    // Scroll the hero section into view, then focus the input
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => inputRef.current?.focus(), 400);
  }

  useEffect(() => {
    let mounted = true;
    getScans(8)
      .then((data) => { if (mounted) setHistory(data); })
      .catch(() => {})
      .finally(() => mounted && setHistoryLoading(false));
    return () => { mounted = false; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return setError('Please enter a URL to scan.');
    setError('');
    setSubmitting(true);
    try {
      const { scanId } = await startScan(trimmed);
      toast({ message: 'Scan started successfully!', type: 'success' });
      onScanStart(scanId);
    } catch (err) {
      setError(err.message || 'Failed to start scan');
      toast({ message: err.message || 'Failed to start scan', type: 'error' });
      setSubmitting(false);
    }
  }

  async function handleDelete(e, scanId) {
    e.stopPropagation();
    setDeletingId(scanId);
    try {
      await deleteScan(scanId);
      setHistory((h) => h.filter((s) => s.scanId !== scanId));
      toast({ message: 'Scan deleted.', type: 'info' });
    } catch {
      toast({ message: 'Failed to delete scan.', type: 'error' });
    }
    setDeletingId(null);
  }

  return (
    <>
      {/* ── Intro splash — renders until the video ends ── */}
      {!introDone && <IntroSplash onDone={() => { setIntroDone(true); hasPlayedIntro = true; }} />}

      {/* ── Main site — always in the DOM behind the splash ── */}
      <div className={`home ${introDone ? 'home--visible' : 'home--hidden'}`}>
        {/* Original animated background */}
        <div className="home-bg">
          <div className="bg-grid" />
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
        </div>

        {/* Navbar */}
        <Navbar onFocusScan={focusScanInput} onScanStart={onScanStart} />

        {/* Hero */}
        <section className="hero">
          <div className="hero-eyebrow fade-up" style={{ animationDelay: introDone ? '0.1s' : '0s' }}>
            <Zap size={11} />
            <span>Automated Vulnerability Intelligence</span>
          </div>

          <h1 className="hero-title fade-up" style={{ animationDelay: introDone ? '0.2s' : '0s' }}>
            Detect threats<br />
            <span className="hero-title-accent">before attackers do</span>
          </h1>

          <p className="hero-subtitle fade-up" style={{ animationDelay: introDone ? '0.3s' : '0s' }}>
            Scan any website for open ports, misconfigurations, exposed files,
            and security vulnerabilities. Clear results, no technical expertise needed.
          </p>

          {/* Scan Form */}
          <form className="scan-form fade-up" style={{ animationDelay: introDone ? '0.4s' : '0s' }} onSubmit={handleSubmit}>
            <div className={`scan-input-row ${error ? 'has-error' : ''}`}>
              <div className="input-icon-wrap"><Globe size={17} /></div>
              <input
                type="text"
                className="scan-input"
                placeholder="example.com or https://example.com"
                ref={inputRef}
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(''); }}
                disabled={submitting}
                autoFocus={introDone}
                spellCheck={false}
              />
              <button
                type="submit"
                className={`scan-submit-btn ${submitting ? 'loading' : ''}`}
                disabled={submitting}
              >
                {submitting ? (
                  <><span className="btn-spinner" /><span>Starting…</span></>
                ) : (
                  <><Search size={15} /><span>Scan Now</span></>
                )}
              </button>
            </div>
            {error && (
              <div className="scan-error">
                <AlertTriangle size={13} />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Feature chips */}
          <div className="features-grid fade-up" style={{ animationDelay: introDone ? '0.5s' : '0s' }}>
            {FEATURES.map(({ icon: Icon, label }) => (
              <div className="feature-chip" key={label}>
                <Icon size={12} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Phases */}
        <section className="phases-section">
          <div className="phases-label">10 Scanning Phases</div>
          <div className="phases-row">
            {SCAN_PHASES.map((ph, i) => (
              <div className="phase-item" key={ph}>
                <div className="phase-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="phase-name">{ph}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Platform ── */}
        <section id="platform" className="section-block">
          <div className="section-inner">
            <div className="section-head">
              <div className="section-eyebrow"><Layers size={11} /><span>Security Platform</span></div>
              <h2 className="section-heading">Enterprise-grade security,<br />built for everyone</h2>
              <p className="section-subtitle">A web-based vulnerability scanning system that identifies security weaknesses using automated analysis — then explains every finding in language anyone can act on.</p>
            </div>
            <div className="platform-grid">
              {PLATFORM_FEATURES.map(({ icon: Icon, title, desc }) => (
                <div className="platform-card" key={title}>
                  <div className="platform-card-icon"><Icon size={20} /></div>
                  <h3 className="platform-card-title">{title}</h3>
                  <p className="platform-card-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="section-block section-alt">
          <div className="section-inner">
            <div className="section-head">
              <div className="section-eyebrow"><Zap size={11} /><span>How It Works</span></div>
              <h2 className="section-heading">From URL to full security report<br />in minutes</h2>
              <p className="section-subtitle">Seven automated phases run back-to-back the moment you hit Scan — powered by Nmap and Nikto under the hood.</p>
            </div>
            <div className="workflow-steps">
              {WORKFLOW_STEPS.map(({ num, label, desc, icon: Icon }, i) => (
                <React.Fragment key={num}>
                  <div className="workflow-step">
                    <div className="workflow-step-icon"><Icon size={16} /></div>
                    <div className="workflow-step-num">{num}</div>
                    <div className="workflow-step-label">{label}</div>
                    <div className="workflow-step-desc">{desc}</div>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && <div className="workflow-connector"><ArrowRight size={12} /></div>}
                </React.Fragment>
              ))}
            </div>
            <div className="tool-badges-row">
              <span className="tool-badge"><Terminal size={12} />Powered by Nmap</span>
              <span className="tool-badge-sep">+</span>
              <span className="tool-badge"><Target size={12} />Nikto Web Scanner</span>
            </div>
          </div>
        </section>

        {/* ── AI Defense ── */}
        <section id="ai-defense" className="section-block">
          <div className="section-inner">
            <div className="section-head">
              <div className="section-eyebrow"><Cpu size={11} /><span>AI Defense</span></div>
              <h2 className="section-heading">Technical jargon,<br />translated into action</h2>
              <p className="section-subtitle">Scantinel's intelligent recommendation layer converts raw scanner output into clear explanations and step-by-step fix guides anyone can follow.</p>
            </div>
            <div className="ai-split">
              <div className="ai-comparison">
                <div className="ai-before">
                  <div className="ai-chip ai-chip-before"><AlertTriangle size={10} />Raw Scanner Output</div>
                  <div className="ai-code">Missing X-Frame-Options Header</div>
                </div>
                <div className="ai-arrow-row"><ArrowDown size={18} /><span>AI Defense</span></div>
                <div className="ai-after">
                  <div className="ai-chip ai-chip-after"><ShieldCheck size={10} />Plain English Explanation</div>
                  <p className="ai-explanation">Your website lacks protection against <strong>clickjacking attacks</strong>, which may allow attackers to trick users into clicking hidden elements on a fake page overlaid on top of yours.</p>
                  <div className="ai-fix-hint"><span className="ai-fix-label">Fix →</span> Add <code>X-Frame-Options: DENY</code> to your HTTP response headers.</div>
                </div>
              </div>
              <div className="ai-capabilities">
                <h3 className="ai-caps-title">What AI Defense does</h3>
                {AI_CAPABILITIES.map(({ icon: Icon, text }) => (
                  <div className="ai-cap-item" key={text}>
                    <div className="ai-cap-icon"><Icon size={14} /></div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Connections ── */}
        <section id="connections" className="section-block section-alt">
          <div className="section-inner">
            <div className="section-head">
              <div className="section-eyebrow"><Network size={11} /><span>Connections</span></div>
              <h2 className="section-heading">One unified workflow,<br />many powerful tools</h2>
              <p className="section-subtitle">Scantinel orchestrates best-in-class security tools and a modern tech stack into a single seamless scanning pipeline.</p>
            </div>
            <div className="connections-grid">
              {CONNECTIONS.map(({ name, role, color, icon: Icon }) => (
                <div className="connection-card" key={name}>
                  <div className="connection-card-icon" style={{ color }}><Icon size={22} /></div>
                  <div className="connection-card-name">{name}</div>
                  <div className="connection-card-role">{role}</div>
                </div>
              ))}
            </div>
            <div className="connections-flow">
              {['Frontend UI', 'Backend API', 'Scanner Tools', 'Result Parser', 'Dashboard'].map((step, i, arr) => (
                <React.Fragment key={step}>
                  <div className="conn-flow-step">{step}</div>
                  {i < arr.length - 1 && <ChevronRight size={14} className="conn-flow-arrow" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ── Insights ── */}
        <section id="insights" className="section-block">
          <div className="section-inner">
            <div className="section-head">
              <div className="section-eyebrow"><BarChart2 size={11} /><span>Insights</span></div>
              <h2 className="section-heading">Clear visibility<br />into every security risk</h2>
              <p className="section-subtitle">Structured findings with severity labels, descriptions, impact analysis, and fix recommendations — no cybersecurity background required.</p>
            </div>
            <div className="insights-list">
              {SAMPLE_INSIGHTS.map(({ severity, title, desc, fix }) => (
                <div className="insight-card" key={title}>
                  <div className={`insight-severity sev-${severity}`}>{severity.toUpperCase()}</div>
                  <div className="insight-body">
                    <div className="insight-title">{title}</div>
                    <div className="insight-desc">{desc}</div>
                    <div className="insight-fix"><span className="insight-fix-label">Fix →</span> {fix}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* History */}
        <section className="history-section">
          <div className="history-header">
            <Clock size={14} />
            <h2>Recent Scans</h2>
          </div>

          {historyLoading ? (
            <div className="history-loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="history-empty">
              <Shield size={28} />
              <p>No scans yet — enter a URL above to get started.</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((scan, i) => (
                <div
                  key={scan.scanId}
                  className="history-card fade-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => onScanStart(scan.scanId)}
                >
                  <div className="hc-left">
                    <div className="hc-url">{scan.url}</div>
                    <div className="hc-meta">
                      <StatusBadge status={scan.status} />
                      <span className="hc-date">{formatDate(scan.createdAt)}</span>
                      {scan.technologies?.length > 0 && (
                        <span className="hc-tech">{scan.technologies.slice(0, 2).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="hc-right">
                    {scan.status === 'completed' && <ScanMiniSummary summary={scan.summary} />}
                    {scan.status === 'running'   && (
                      <div className="hc-running"><span className="running-dot" />Scanning</div>
                    )}
                    {scan.status === 'failed'    && (
                      <div className="hc-failed"><AlertTriangle size={13} />Failed</div>
                    )}
                    <button
                      className={`hc-delete ${deletingId === scan.scanId ? 'deleting' : ''}`}
                      onClick={(e) => handleDelete(e, scan.scanId)}
                      title="Delete scan"
                    >
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={15} color="var(--text-4)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
