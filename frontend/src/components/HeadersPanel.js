import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import './HeadersPanel.css';

const IMPORTANT_HEADERS = [
  { key: 'strict-transport-security',      label: 'HSTS',                   good: true  },
  { key: 'content-security-policy',        label: 'Content-Security-Policy', good: true  },
  { key: 'x-frame-options',               label: 'X-Frame-Options',         good: true  },
  { key: 'x-content-type-options',        label: 'X-Content-Type-Options',  good: true  },
  { key: 'referrer-policy',               label: 'Referrer-Policy',         good: true  },
  { key: 'permissions-policy',            label: 'Permissions-Policy',      good: true  },
  { key: 'cross-origin-embedder-policy',  label: 'COEP',                   good: true  },
  { key: 'server',                        label: 'Server',                  good: false },
  { key: 'x-powered-by',                 label: 'X-Powered-By',            good: false },
  { key: 'access-control-allow-origin',  label: 'CORS Origin',             good: null  },
  { key: 'set-cookie',                   label: 'Set-Cookie',              good: null  }
];

export default function HeadersPanel({ headers = {} }) {
  const [showAll, setShowAll] = useState(false);

  const allKeys = Object.keys(headers);
  const displayKeys = showAll ? allKeys : allKeys.slice(0, 12);

  return (
    <div className="headers-panel">
      <div className="headers-security">
        <div className="headers-sec-title">Security Header Checklist</div>
        <div className="headers-checklist">
          {IMPORTANT_HEADERS.map(h => {
            const present = headers[h.key] !== undefined;
            const isGood  = h.good === true  ? present  :
                            h.good === false ? !present :
                            null; // neutral
            return (
              <div key={h.key} className={`hcheck-row ${isGood === true ? 'good' : isGood === false ? 'bad' : 'neutral'}`}>
                <div className="hcheck-icon">
                  {isGood === true  ? <CheckCircle size={13} /> :
                   isGood === false ? <XCircle size={13} /> :
                   <span className="hcheck-dot" />}
                </div>
                <div className="hcheck-name">{h.label}</div>
                <div className="hcheck-val">
                  {present
                    ? <span className="hval">{String(headers[h.key]).slice(0, 60)}{String(headers[h.key]).length > 60 ? '…' : ''}</span>
                    : <span className="hval-missing">Not set</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="headers-raw">
        <div className="headers-raw-title">All Response Headers</div>
        <div className="headers-raw-list">
          {displayKeys.map(k => (
            <div key={k} className="hraw-row">
              <span className="hraw-key">{k}</span>
              <span className="hraw-val">{String(headers[k]).slice(0, 120)}{String(headers[k]).length > 120 ? '…' : ''}</span>
            </div>
          ))}
        </div>
        {allKeys.length > 12 && (
          <button className="headers-toggle" onClick={() => setShowAll(!showAll)}>
            {showAll
              ? <><ChevronUp size={13} /> Show less</>
              : <><ChevronDown size={13} /> Show all {allKeys.length} headers</>}
          </button>
        )}
      </div>
    </div>
  );
}
