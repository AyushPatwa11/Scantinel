import React, { useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { generatePDFReport } from '../utils/reportGenerator';
import { GRADE_META, SEVERITY_META, sortFindings, formatDuration, formatDate } from '../utils/helpers';
import FindingCard from './FindingCard';
import PortsPanel from './PortsPanel';
import ScoreGauge from './ScoreGauge';
import HeadersPanel from './HeadersPanel';
import TechnologiesPanel from './TechnologiesPanel';
import { useToast } from '../context/ToastContext';
import {
  Download, Shield, AlertTriangle, AlertCircle, Info,
  Server, Globe, Clock, Zap, ChevronDown, CheckCircle,
  BarChart2, Filter
} from 'lucide-react';
import './ResultsDashboard.css';

const SEV_FILTERS = [
  { key: 'all',      label: 'All Issues'  },
  { key: 'critical', label: 'Critical'    },
  { key: 'high',     label: 'High'        },
  { key: 'medium',   label: 'Medium'      },
  { key: 'low',      label: 'Low'         },
  { key: 'info',     label: 'Info'        }
];

export default function ResultsDashboard({ scan, onBack }) {
  const [sevFilter, setSevFilter]   = useState('all');
  const [catFilter, setCatFilter]   = useState('all');
  const [exporting, setExporting]   = useState(false);
  const [activeTab, setActiveTab]   = useState('findings');
  const { toast } = useToast();

  const { summary = {}, findings = [], openPorts = [], technologies = [] } = scan;
  const gm = GRADE_META[summary.grade] || {};

  // Categories from findings
  const categories = ['all', ...new Set(findings.map(f => f.category))];

  // Filtered & sorted findings
  const filtered = sortFindings(findings).filter(f => {
    const sevOk = sevFilter === 'all' || f.severity === sevFilter;
    const catOk = catFilter === 'all' || f.category === catFilter;
    return sevOk && catOk;
  });

  // Radar chart data
  const radarData = [
    { subject: 'Headers',    value: findings.filter(f => f.category === 'Security Headers').length   },
    { subject: 'Encryption', value: findings.filter(f => f.category === 'Encryption').length         },
    { subject: 'Ports',      value: findings.filter(f => f.category === 'Network Security').length   },
    { subject: 'Exposure',   value: findings.filter(f => f.category === 'Exposed Resources').length  },
    { subject: 'Cookies',    value: findings.filter(f => f.category === 'Cookie Security').length    },
    { subject: 'Access',     value: findings.filter(f => f.category === 'Access Control').length     }
  ];

  // Bar chart data
  const barData = [
    { name: 'Critical', count: summary.critical || 0, color: 'var(--crit)' },
    { name: 'High',     count: summary.high     || 0, color: 'var(--high)' },
    { name: 'Medium',   count: summary.medium   || 0, color: 'var(--med)'  },
    { name: 'Low',      count: summary.low      || 0, color: 'var(--low)'  },
    { name: 'Info',     count: summary.info     || 0, color: 'var(--info)' }
  ];

  async function handleExport() {
    setExporting(true);
    try {
      generatePDFReport(scan);
      toast({ message: 'PDF report downloaded successfully!', type: 'success' });
    } catch (e) {
      console.error(e);
      toast({ message: 'Failed to generate PDF report.', type: 'error' });
    } finally {
      setTimeout(() => setExporting(false), 1500);
    }
  }

  return (
    <div className="results-dashboard">
      {/* Top bar */}
      <div className="results-topbar">
        <div className="topbar-left">
          <Globe size={14} color="var(--text-3)" />
          <span className="topbar-url">{scan.url}</span>
          <span className="topbar-divider">·</span>
          <span className="topbar-date">{formatDate(scan.completedAt)}</span>
        </div>
        <button
          className={`export-btn ${exporting ? 'exporting' : ''}`}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting
            ? <><span className="btn-spinner-sm" />Generating...</>
            : <><Download size={13} />Export PDF Report</>}
        </button>
      </div>

      <div className="results-body">
        {/* ── Score hero ─────────────────────────────────────────────────── */}
        <section className="score-hero fade-up">
          <div className="score-grade-wrap">
            <ScoreGauge
              score={summary.riskScore ?? 0}
              grade={summary.grade || '?'}
              color={gm.color || 'var(--accent)'}
              size={140}
            />
            <div className="score-meta">
              <div className="score-risk-level" style={{ color: gm.color }}>{summary.riskLevel || 'Unknown'}</div>
              <div className="score-desc">Overall Security Score</div>
              <div className="score-total-label">{summary.total || 0} total issues detected</div>
            </div>
          </div>

          {/* Severity counters */}
          <div className="sev-counters">
            {[
              { key: 'critical', Icon: AlertTriangle, label: 'Critical' },
              { key: 'high',     Icon: AlertTriangle, label: 'High'     },
              { key: 'medium',   Icon: AlertCircle,   label: 'Medium'   },
              { key: 'low',      Icon: Info,          label: 'Low'      },
              { key: 'info',     Icon: Info,          label: 'Info'     }
            ].map(({ key, Icon, label }) => {
              const sm = SEVERITY_META[key];
              return (
                <div
                  key={key}
                  className={`sev-counter ${sevFilter === key ? 'active' : ''}`}
                  style={{ '--sc': sm.color, '--sbg': sm.bg, '--sborder': sm.border }}
                  onClick={() => setSevFilter(sevFilter === key ? 'all' : key)}
                >
                  <Icon size={15} style={{ color: sm.color }} />
                  <div className="sev-counter-num">{summary[key] || 0}</div>
                  <div className="sev-counter-label">{label}</div>
                </div>
              );
            })}
          </div>

          {/* Scan meta */}
          <div className="scan-meta-row">
            <div className="meta-item"><Clock size={12} /><span>Duration: {formatDuration(scan.durationMs)}</span></div>
            <div className="meta-item"><Server size={12} /><span>Open ports: {openPorts.length}</span></div>
            <div className="meta-item"><Shield size={12} /><span>Issues found: {findings.length}</span></div>
            {technologies.length > 0 && (
              <div className="meta-item"><Zap size={12} /><span>{technologies.slice(0,3).join(', ')}</span></div>
            )}
          </div>

          {technologies.length > 0 && (
            <TechnologiesPanel technologies={technologies} />
          )}
        </section>

        {/* ── Charts row ──────────────────────────────────────────────────── */}
        <section className="charts-row fade-up" style={{ animationDelay: '0.08s' }}>
          <div className="chart-card">
            <div className="chart-title"><BarChart2 size={14} />Findings by Severity</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 8, fontSize: 12, color: 'var(--text-1)' }}
                  itemStyle={{ color: 'var(--text-1)' }}
                  labelStyle={{ color: 'var(--text-2)', fontSize: 11 }}
                />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title"><Shield size={14} />Coverage by Category</div>
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={60}>
                <PolarGrid stroke="var(--border-2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-3)', fontSize: 10 }} />
                <Radar name="Issues" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card info-card">
            <div className="chart-title"><Globe size={14} />Target Details</div>
            <div className="info-rows">
              <div className="info-row"><span>URL</span><strong>{scan.url}</strong></div>
              <div className="info-row"><span>Status</span>
                <strong style={{ color: 'var(--safe)' }}>✓ Completed</strong>
              </div>
              <div className="info-row"><span>Duration</span><strong>{formatDuration(scan.durationMs)}</strong></div>
              <div className="info-row"><span>Open Ports</span><strong>{openPorts.length}</strong></div>
              <div className="info-row"><span>Total Findings</span><strong>{findings.length}</strong></div>
              {technologies.length > 0 && (
                <div className="info-row">
                  <span>Stack</span>
                  <strong>{technologies.slice(0,3).join(', ')}</strong>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="results-tabs fade-up" style={{ animationDelay: '0.12s' }}>
          {[
            { key: 'findings', label: `Findings (${findings.length})`,    icon: AlertTriangle },
            { key: 'ports',    label: `Open Ports (${openPorts.length})`,  icon: Server        },
            { key: 'headers',  label: 'HTTP Headers',                      icon: Shield        }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`results-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {activeTab === 'findings' && (
          <section className="findings-section fade-up" style={{ animationDelay: '0.16s' }}>
            {/* Filters */}
            <div className="filters-bar">
              <div className="filter-sev">
                {SEV_FILTERS.map(f => (
                  <button
                    key={f.key}
                    className={`sev-filter-btn ${sevFilter === f.key ? 'active' : ''} sev-${f.key}`}
                    onClick={() => setSevFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="filter-cat-wrap">
                <Filter size={12} color="var(--text-3)" />
                <select
                  className="cat-select"
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                  ))}
                </select>
                <ChevronDown size={12} color="var(--text-3)" />
              </div>
            </div>

            {/* Findings list */}
            {filtered.length === 0 ? (
              <div className="no-findings">
                <CheckCircle size={36} color="var(--safe)" />
                <p>No findings match the selected filters.</p>
              </div>
            ) : (
              <div className="findings-list">
                {filtered.map((f, i) => (
                  <FindingCard
                    key={f.id}
                    finding={f}
                    defaultOpen={f.severity === 'critical' && i < 3}
                    index={i}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'ports' && (
          <section className="fade-up" style={{ animationDelay: '0.16s' }}>
            <PortsPanel ports={openPorts} />
          </section>
        )}

        {activeTab === 'headers' && (
          <section className="fade-up" style={{ animationDelay: '0.16s' }}>
            <HeadersPanel headers={scan.headers || {}} />
          </section>
        )}
      </div>
    </div>
  );
}
