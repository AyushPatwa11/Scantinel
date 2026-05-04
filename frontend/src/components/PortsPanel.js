import React from 'react';
import { PORT_RISK } from '../utils/helpers';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import './PortsPanel.css';

const RISK_ICONS = {
  critical: AlertTriangle,
  high:     AlertTriangle,
  medium:   Info,
  low:      Info,
  safe:     CheckCircle,
  unknown:  Info
};

const RISK_DESCRIPTIONS = {
  critical: 'This port exposes a critical service. Close or restrict immediately.',
  high:     'High-risk service exposed. Restrict access to trusted IPs.',
  medium:   'Moderate risk. Review if this service needs to be publicly accessible.',
  low:      'Low risk but monitor for unusual activity.',
  safe:     'Standard web port. Ensure the service is properly configured.',
  unknown:  'Unknown service. Investigate what is running on this port.'
};

export default function PortsPanel({ ports }) {
  if (!ports || ports.length === 0) {
    return (
      <div className="ports-empty">
        <CheckCircle size={36} color="var(--safe)" />
        <p>No open ports detected on common port list.</p>
      </div>
    );
  }

  const sorted = [...ports].sort((a, b) => {
    const order = { critical:0, high:1, medium:2, low:3, safe:4, unknown:5 };
    return (order[a.risk] ?? 5) - (order[b.risk] ?? 5);
  });

  return (
    <div className="ports-panel">
      <div className="ports-header">
        <Shield size={14} />
        <h3>Open Ports & Services</h3>
        <span className="ports-count">{ports.length} detected</span>
      </div>

      <div className="ports-grid">
        {sorted.map(port => {
          const pr   = PORT_RISK[port.risk] || PORT_RISK.unknown;
          const Icon = RISK_ICONS[port.risk] || Info;
          return (
            <div
              key={port.port}
              className="port-card"
              style={{ '--pc': pr.color, '--pbg': pr.bg }}
            >
              <div className="port-card-top">
                <div className="port-number">{port.port}</div>
                <div
                  className="port-risk-badge"
                  style={{ color: pr.color, background: pr.bg }}
                >
                  <Icon size={10} />
                  {port.risk?.toUpperCase() || 'UNKNOWN'}
                </div>
              </div>
              <div className="port-service">{port.service || 'Unknown'}</div>
              <div className="port-proto">{port.protocol?.toUpperCase() || 'TCP'} · {port.state?.toUpperCase() || 'OPEN'}</div>
              <div className="port-desc">{RISK_DESCRIPTIONS[port.risk] || RISK_DESCRIPTIONS.unknown}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
