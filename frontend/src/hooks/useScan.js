import { useState, useEffect, useRef, useCallback } from 'react';
import { getScan, createProgressStream } from '../utils/api';

export default function useScan(scanId) {
  const [scan, setScan] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing...');
  const [phase, setPhase] = useState('');
  const [status, setStatus] = useState('queued');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const esRef = useRef(null);

  const fetchScan = useCallback(async () => {
    try {
      const data = await getScan(scanId);
      setScan(data);
      setStatus(data.status);
      setProgress(data.progress || 0);
      setCurrentStep(data.currentStep || '');
      setPhase(data.currentPhase || '');
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    if (!scanId) return;

    fetchScan().then(data => {
      if (!data || data.status === 'completed' || data.status === 'failed') return;

      // Open SSE stream for live progress
      const es = createProgressStream(scanId, {
        onMessage(msg) {
          if (msg.event === 'progress' || msg.status === 'running') {
            setStatus('running');
            if (msg.progress !== undefined) setProgress(msg.progress);
            if (msg.currentStep) setCurrentStep(msg.currentStep);
            if (msg.phase !== undefined) setPhase(msg.phase);
          }
          if (msg.event === 'complete' || msg.status === 'completed') {
            setStatus('completed');
            setProgress(100);
            fetchScan();
            es.close();
          }
          if (msg.event === 'error' || msg.status === 'failed') {
            setStatus('failed');
            setError(msg.error || 'Scan failed');
            fetchScan();
            es.close();
          }
        },
        onError() { setStatus(prev => prev !== 'completed' ? 'failed' : prev); },
        onClose()  { }
      });
      esRef.current = es;
    });

    return () => { esRef.current?.close(); };
  }, [scanId, fetchScan]);

  const isScanning = status === 'queued' || status === 'running';

  return { scan, progress, currentStep, phase, status, error, loading, isScanning, refetch: fetchScan };
}
