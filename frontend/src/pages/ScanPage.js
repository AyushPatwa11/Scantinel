import React from 'react';
import useScan from '../hooks/useScan';
import ScanningView from '../components/ScanningView';
import ResultsDashboard from '../components/ResultsDashboard';
import { ArrowLeft, Shield } from 'lucide-react';
import './ScanPage.css';

export default function ScanPage({ scanId, onBack }) {
  const { scan, progress, currentStep, phase, status, error, loading, isScanning } = useScan(scanId);

  return (
    <div className="scan-page">
      {/* Nav */}
      <nav className="scan-nav">
        <button className="nav-back" onClick={onBack}>
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>
        <div className="scan-nav-brand">
          <Shield size={14} color="var(--accent)" />
          <span>VulnScan</span>
        </div>
        <div className="scan-nav-url">
          {scan?.url || ''}
        </div>
      </nav>

      {/* Content */}
      {loading ? (
        <div className="scan-loading">
          <div className="scan-loading-spinner" />
          <p>Loading scan data...</p>
        </div>
      ) : status === 'failed' || error ? (
        <div className="scan-error-view">
          <div className="scan-error-icon">⚠</div>
          <h2>Scan Failed</h2>
          <p>{error || scan?.error || 'An unexpected error occurred.'}</p>
          <button className="nav-back" onClick={onBack}>
            <ArrowLeft size={14} /> Try Again
          </button>
        </div>
      ) : isScanning ? (
        <ScanningView
          url={scan?.url || ''}
          progress={progress}
          currentStep={currentStep}
          phase={phase}
        />
      ) : scan ? (
        <ResultsDashboard scan={scan} onBack={onBack} />
      ) : null}
    </div>
  );
}
