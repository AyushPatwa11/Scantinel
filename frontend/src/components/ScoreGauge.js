import React from 'react';

/**
 * Circular arc gauge showing risk score 0–100.
 * Uses SVG stroke-dasharray trick for the arc fill.
 */
export default function ScoreGauge({ score = 0, grade = 'N/A', color = '#5b73ff', size = 140 }) {
  const R        = 52;           // radius
  const CX       = size / 2;
  const CY       = size / 2;
  const CIRCUMF  = 2 * Math.PI * R;
  const ARC_FRAC = 0.75;        // 270° arc (¾ of circle)
  const arcLen   = CIRCUMF * ARC_FRAC;
  const filled   = arcLen * (score / 100);
  const gap      = arcLen - filled;

  // Rotate so arc starts bottom-left and ends bottom-right
  const rotation = 135;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={10}
        strokeDasharray={`${arcLen} ${CIRCUMF - arcLen}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${CX} ${CY})`}
      />
      {/* Fill */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${filled} ${gap + (CIRCUMF - arcLen)}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${CX} ${CY})`}
        style={{ filter: `drop-shadow(0 0 6px ${color}66)`, transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Grade */}
      <text
        x={CX} y={CY - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize="30"
        fontWeight="800"
        fontFamily="Syne, sans-serif"
      >
        {grade}
      </text>
      {/* Score */}
      <text
        x={CX} y={CY + 18}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(226,228,240,0.45)"
        fontSize="11"
        fontFamily="Outfit, sans-serif"
      >
        {score}/100
      </text>
    </svg>
  );
}
