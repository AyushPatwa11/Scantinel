import React, { useState, useEffect } from 'react';
import './styles/globals.css';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';

export default function App() {
  const [view, setView]       = useState('home');
  const [scanId, setScanId]   = useState(null);

  useEffect(() => {
    // Scroll to the top when the app mounts (e.g. on page refresh)
    window.scrollTo(0, 0);
  }, []);

  function handleScanStart(id) {
    setScanId(id);
    setView('scan');
  }

  function handleBack() {
    setScanId(null);
    setView('home');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  return (
    <>
      {view === 'home'
        ? <HomePage onScanStart={handleScanStart} />
        : <ScanPage scanId={scanId} onBack={handleBack} />}
    </>
  );
}
