import React, { useState } from 'react';
import './styles/globals.css';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';

export default function App() {
  const [view, setView]       = useState('home');
  const [scanId, setScanId]   = useState(null);

  function handleScanStart(id) {
    setScanId(id);
    setView('scan');
  }

  function handleBack() {
    setScanId(null);
    setView('home');
  }

  return view === 'home'
    ? <HomePage onScanStart={handleScanStart} />
    : <ScanPage scanId={scanId} onBack={handleBack} />;
}
