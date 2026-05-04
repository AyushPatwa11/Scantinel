import React, { useState, useEffect } from 'react';
import { startScan, getScans, deleteScan } from '../utils/api';
import { GRADE_META, formatDate } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import {
  Shield, Search, Globe, ChevronRight, Trash2,
  Activity, Clock, AlertTriangle, CheckCircle, Zap,
  Lock, Eye, Server, FileWarning, Wifi
} from 'lucide-react';
import './HomePage.css';

const FEATURES = [
  { icon: Lock,        label: 'SSL / TLS Verification'      },
  { icon: Shield,      label: 'Security Header Analysis'     },
  { icon: Eye,         label: 'Sensitive File Detection'     },
  { icon: Server,      label: 'Open Port Scanning'           },
  { icon: FileWarning, label: 'Cookie Security Audit'        },
  { icon: Wifi,        label: 'CORS Policy Analysis'         },
  { icon: Activity,    label: 'Information Leakage Check'    },
  { icon: Zap,         label: 'Risk Scoring & Grading'       }
];

const SCAN_PHASES = [
  'Reconnaissance', 'Header Analysis', 'Encryption', 'Information Leakage',
  'Cookie Security', 'Access Control', 'Exposed Resources', 'Port Scanning',
  'Content Security', 'Risk Assessment'
];

export default function HomePage({ onScanStart }) {
  const [url, setUrl]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [history, setHistory]     = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    getScans(8)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
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
      setError(err.message);
      toast({ message: err.message, type: 'error' });
      setSubmitting(false);
    }
  }

  async function handleDelete(e, scanId) {
    e.stopPropagation();
    setDeletingId(scanId);
    try {
      await deleteScan(scanId);
      setHistory(h => h.filter(s => s.scanId !== scanId));
      toast({ message: 'Scan deleted.', type: 'info' });
    } catch {
      toast({ message: 'Failed to delete scan.', type: 'error' });
    }
    setDeletingId(null);
  }

  return (
    <div className="home">
      {/* Background */}
      <div className="home-bg">
        <div className="bg-grid" />
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Nav */}
      <nav className="home-nav">
          <div className="nav-brand">
          <div className="brand-icon"><Shield size={16} /></div>
          <span className="brand-name">Scantinel</span>
        </div>
        <div className="nav-meta">Security Intelligence Platform</div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-eyebrow">
          <Zap size={11} />
          <span>Automated Vulnerability Intelligence</span>
        </div>

        <h1 className="hero-title">
          Detect threats<br />
          <span className="hero-title-accent">before attackers do</span>
        </h1>

        <p className="hero-subtitle">
          Scan any website for open ports, misconfigurations, exposed files,
          and security vulnerabilities. Clear results, no technical expertise needed.
        </p>

        {/* Scan form */}
        <form className="scan-form" onSubmit={handleSubmit}>
          <div className={`scan-input-row ${error ? 'has-error' : ''}`}>
            <div className="input-icon-wrap"><Globe size={17} /></div>
            <input
              type="text"
              className="scan-input"
              placeholder="example.com or https://example.com"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(''); }}
              disabled={submitting}
              autoFocus
              spellCheck={false}
            />
            <button type="submit" className={`scan-submit-btn ${submitting ? 'loading' : ''}`} disabled={submitting}>
              {submitting ? (
                <><span className="btn-spinner" /><span>Starting...</span></>
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
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div className="feature-chip" key={label}>
              <Icon size={12} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Scan phases visual */}
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

      {/* History */}
      <section className="history-section">
        <div className="history-header">
          <Clock size={14} />
          <h2>Recent Scans</h2>
        </div>

        {historyLoading ? (
          <div className="history-loading">
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
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
                      <span className="hc-tech">{scan.technologies.slice(0,2).join(', ')}</span>
                    )}
                  </div>
                </div>
                <div className="hc-right">
                  {scan.status === 'completed' && <ScanMiniSummary summary={scan.summary} />}
                  {scan.status === 'running'   && <div className="hc-running"><span className="running-dot" />Scanning</div>}
                  {scan.status === 'failed'    && <div className="hc-failed"><AlertTriangle size={13} />Failed</div>}
                  <button
                    className={`hc-delete ${deletingId === scan.scanId ? 'deleting' : ''}`}
                    onClick={e => handleDelete(e, scan.scanId)}
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
  );
}

function StatusBadge({ status }) {
  const cfg = {
    completed: { color: 'var(--safe)',   icon: CheckCircle,    label: 'Completed' },
    running:   { color: 'var(--accent)', icon: Activity,       label: 'Running'   },
    failed:    { color: 'var(--crit)',   icon: AlertTriangle,  label: 'Failed'    },
    queued:    { color: 'var(--text-3)', icon: Clock,          label: 'Queued'    }
  }[status] || { color: 'var(--text-3)', icon: Clock, label: status };
  const Icon = cfg.icon;
  return (
    <span className="status-badge" style={{ color: cfg.color, background: `${cfg.color}18` }}>
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

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
