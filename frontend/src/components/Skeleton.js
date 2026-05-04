import React from 'react';
import './Skeleton.css';

export function SkeletonCard({ height = 64, style = {} }) {
  return (
    <div
      className="skeleton-card"
      style={{ height, borderRadius: 12, ...style }}
    />
  );
}

export function SkeletonText({ width = '60%', height = 14, style = {} }) {
  return (
    <div
      className="skeleton-card"
      style={{ width, height, borderRadius: 6, ...style }}
    />
  );
}

export function SkeletonFinding() {
  return (
    <div className="skeleton-finding">
      <div className="sf-header">
        <div className="skeleton-card" style={{ width: 30, height: 30, borderRadius: 8 }} />
        <div className="sf-lines">
          <div className="skeleton-card" style={{ width: '55%', height: 14, borderRadius: 6 }} />
          <div className="skeleton-card" style={{ width: '30%', height: 10, borderRadius: 6, marginTop: 6 }} />
        </div>
      </div>
    </div>
  );
}
