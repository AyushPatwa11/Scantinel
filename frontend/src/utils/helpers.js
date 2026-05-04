export const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export const SEVERITY_META = {
  critical: { label: 'Critical', color: 'var(--crit)',  bg: 'var(--crit-bg)',  border: 'var(--crit-border)' },
  high:     { label: 'High',     color: 'var(--high)',  bg: 'var(--high-bg)',  border: 'var(--high-border)' },
  medium:   { label: 'Medium',   color: 'var(--med)',   bg: 'var(--med-bg)',   border: 'var(--med-border)'  },
  low:      { label: 'Low',      color: 'var(--low)',   bg: 'var(--low-bg)',   border: 'var(--low-border)'  },
  info:     { label: 'Info',     color: 'var(--info)',  bg: 'var(--info-bg)',  border: 'rgba(123,143,255,0.2)' }
};

export const GRADE_META = {
  A: { color: 'var(--safe)',   label: 'Excellent' },
  B: { color: '#22d3ee',       label: 'Good'      },
  C: { color: 'var(--med)',    label: 'Fair'      },
  D: { color: 'var(--high)',   label: 'Poor'      },
  F: { color: 'var(--crit)',   label: 'Critical'  }
};

export const PORT_RISK = {
  critical: { color: 'var(--crit)', bg: 'var(--crit-bg)' },
  high:     { color: 'var(--high)', bg: 'var(--high-bg)' },
  medium:   { color: 'var(--med)',  bg: 'var(--med-bg)'  },
  low:      { color: 'var(--low)',  bg: 'var(--low-bg)'  },
  safe:     { color: 'var(--safe)', bg: 'var(--safe-bg)' },
  unknown:  { color: 'var(--text-3)', bg: 'rgba(84,92,136,0.1)' }
};

export function sortFindings(findings) {
  return [...findings].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5));
}

export function formatDuration(ms) {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
