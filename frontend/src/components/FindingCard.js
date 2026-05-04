import React, { useState } from 'react';
import { SEVERITY_META } from '../utils/helpers';
import {
  AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp,
  Lightbulb, Search, Tag, Hash, ExternalLink
} from 'lucide-react';
import './FindingCard.css';

const SEV_ICONS = {
  critical: AlertTriangle,
  high:     AlertTriangle,
  medium:   AlertCircle,
  low:      Info,
  info:     Info
};

export default function FindingCard({ finding, defaultOpen = false, index = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  const sm   = SEVERITY_META[finding.severity] || SEVERITY_META.info;
  const Icon = SEV_ICONS[finding.severity] || Info;

  return (
    <div
      className={`finding-card ${finding.severity} ${open ? 'is-open' : ''} fade-up`}
      style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
    >
      {/* Header */}
      <div className="fc-header" onClick={() => setOpen(!open)}>
        <div className="fc-header-left">
          <div className="fc-sev-icon" style={{ background: sm.bg, color: sm.color }}>
            <Icon size={13} />
          </div>
          <div className="fc-titles">
            <div className="fc-title">{finding.title}</div>
            <div className="fc-badges">
              <span className="fc-sev-badge" style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}>
                {sm.label}
              </span>
              {finding.category && (
                <span className="fc-cat-badge"><Tag size={9} />{finding.category}</span>
              )}
              {finding.port && (
                <span className="fc-cat-badge"><Hash size={9} />Port {finding.port}</span>
              )}
              {finding.cvss > 0 && (
                <span className="fc-cvss" style={{ color: sm.color }}>CVSS {finding.cvss?.toFixed(1)}</span>
              )}
              {finding.cwe && (
                <span className="fc-cwe">{finding.cwe}</span>
              )}
            </div>
          </div>
        </div>
        <div className="fc-expand-btn" style={{ color: open ? sm.color : 'var(--text-4)' }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="fc-body">
          {/* What it means */}
          <div className="fc-section">
            <div className="fc-section-header">
              <Search size={12} />
              <span>What does this mean?</span>
            </div>
            <p className="fc-desc">{finding.description}</p>
          </div>

          {/* Impact */}
          {finding.impact && (
            <div className="fc-section fc-impact">
              <div className="fc-section-header" style={{ color: sm.color }}>
                <AlertTriangle size={12} />
                <span>Potential Impact</span>
              </div>
              <p className="fc-desc">{finding.impact}</p>
            </div>
          )}

          {/* Recommendation */}
          <div className="fc-section fc-rec">
            <div className="fc-section-header">
              <Lightbulb size={12} />
              <span>How to fix this</span>
            </div>
            <p className="fc-rec-text">{finding.recommendation}</p>
          </div>

          {/* Evidence */}
          {finding.evidence && (
            <div className="fc-evidence">
              <span className="fc-evidence-label">Technical Evidence</span>
              <code className="fc-evidence-code">{finding.evidence}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
