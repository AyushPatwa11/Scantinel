import React, { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';
import radarAnimation from './radar-lottie.json';
import './ScanningView.css';

const ALL_STEPS = [
  { phase: 'Reconnaissance',      label: 'Connecting to target server'             },
  { phase: 'Header Analysis',     label: 'Analyzing security response headers'     },
  { phase: 'Encryption',          label: 'Verifying SSL/TLS configuration'         },
  { phase: 'Information Leakage', label: 'Scanning for information disclosure'     },
  { phase: 'Cookie Security',     label: 'Checking cookie security flags'          },
  { phase: 'Access Control',      label: 'Testing CORS and access control'         },
  { phase: 'Exposed Resources',   label: 'Scanning for exposed sensitive files'    },
  { phase: 'Port Scanning',       label: 'Scanning network ports and services'     },
  { phase: 'Content Security',    label: 'Analyzing content and form security'     },
  { phase: 'Risk Assessment',     label: 'Calculating security risk score'         },
];

export default function ScanningView({ url, progress, currentStep, phase }) {
  const lottieRef     = useRef(null);
  const animationRef  = useRef(null);
  const [dots, setDots] = useState('');

  // Animate the ellipsis dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  // Mount the Lottie animation
  useEffect(() => {
    if (!lottieRef.current) return;
    animationRef.current = lottie.loadAnimation({
      container:     lottieRef.current,
      renderer:      'svg',
      loop:          true,
      autoplay:      true,
      animationData: radarAnimation,
    });
    return () => {
      animationRef.current?.destroy();
    };
  }, []);

  const currentIdx = ALL_STEPS.findIndex(s => s.phase === phase);

  return (
    <div className="scanning-view">
      {/* Left panel — Lottie radar */}
      <div className="scanning-left">
        <div className="lottie-wrap">
          <div ref={lottieRef} className="lottie-player" />
        </div>

        <div className="scanning-url">
          <span className="scan-prefix">TARGET</span>
          <span className="scan-target">{url || 'Scanning...'}</span>
        </div>

        <div className="progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
            <div className="progress-glow"  style={{ left:  `${progress}%` }} />
          </div>
          <div className="progress-labels">
            <span className="current-step">{currentStep}{dots}</span>
            <span className="progress-pct">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Right panel — step list */}
      <div className="scanning-right">
        <div className="steps-heading">Scan Progress</div>
        <div className="steps-list">
          {ALL_STEPS.map((step, i) => {
            const done    = currentIdx > i;
            const current = currentIdx === i;
            return (
              <div
                key={step.phase}
                className={`step-row ${done ? 'done' : current ? 'current' : 'pending'}`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="step-indicator">
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="var(--safe)" fillOpacity="0.15" stroke="var(--safe)" strokeWidth="1"/>
                      <path d="M4 7l2 2 4-4" stroke="var(--safe)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : current ? (
                    <div className="step-active-dot" />
                  ) : (
                    <div className="step-pending-dot" />
                  )}
                </div>
                <div className="step-content">
                  <div className="step-phase">{step.phase}</div>
                  <div className="step-label">{step.label}</div>
                </div>
                {current && <div className="step-badge">Running</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
