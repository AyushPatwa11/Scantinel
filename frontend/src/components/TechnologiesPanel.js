import React from 'react';
import { Cpu } from 'lucide-react';
import './TechnologiesPanel.css';

// Simple icon mapping by tech name substring
function getTechColor(name = '') {
  const n = name.toLowerCase();
  if (n.includes('wordpress'))  return '#21759b';
  if (n.includes('react'))      return '#61dafb';
  if (n.includes('next'))       return '#fff';
  if (n.includes('vue'))        return '#42b883';
  if (n.includes('angular'))    return '#dd0031';
  if (n.includes('nginx'))      return '#009900';
  if (n.includes('apache'))     return '#d22128';
  if (n.includes('php'))        return '#777bb3';
  if (n.includes('node'))       return '#68a063';
  if (n.includes('django'))     return '#092e20';
  if (n.includes('laravel'))    return '#ff2d20';
  if (n.includes('express'))    return '#eeeeee';
  return 'var(--accent)';
}

export default function TechnologiesPanel({ technologies = [] }) {
  if (!technologies.length) return null;

  return (
    <div className="tech-panel">
      <div className="tech-header">
        <Cpu size={14} color="var(--accent)" />
        <span>Detected Technologies</span>
        <span className="tech-count">{technologies.length}</span>
      </div>
      <div className="tech-chips">
        {technologies.map(tech => (
          <div key={tech} className="tech-chip" style={{ '--tc': getTechColor(tech) }}>
            <div className="tech-dot" />
            <span>{tech}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
