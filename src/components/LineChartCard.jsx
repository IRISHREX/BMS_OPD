import React, { useState } from 'react';
import CountUp from 'react-countup';
import AnimatedSvgNumber from './AnimatedSvgNumber';
import './ChartCards.css';

const fmtVal = (n) => {
  const v = Number(n) || 0;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${v.toLocaleString()}`;
};

const LineChartCard = ({ data, title }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <div className="no-data">No data to display</div>
      </div>
    );
  }

  const chartHeight = 190;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 32;
  const paddingBottom = 38;
  const availableHeight = chartHeight - paddingTop - paddingBottom;
  const chartWidth = Math.max(380, data.length * 55);

  const maxVal = Math.max(...data.map(d => Number(d.value) || 0), 100);
  const pointGap = data.length > 1 ? (chartWidth - paddingLeft - paddingRight) / (data.length - 1) : 0;

  const pointsArr = data.map((item, i) => {
    const x = i * pointGap + paddingLeft;
    const val = Number(item.value) || 0;
    const y = (chartHeight - paddingBottom) - (val / maxVal) * availableHeight;
    return { x, y, name: item.name, value: val };
  });

  const polylineStr = pointsArr.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <h3>{title}</h3>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>
          Total: <CountUp end={data.reduce((s, it) => s + (Number(it.value) || 0), 0)} separator="," prefix="₹" duration={2} />
        </span>
      </div>
      <div className="line-chart-container" style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight} style={{ minWidth: `${chartWidth}px` }}>
          <defs>
            <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y-axis baseline */}
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={chartHeight - paddingBottom} stroke="#e5e7eb" />
          <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="#cbd5e1" />

          {/* Area under curve */}
          {pointsArr.length > 1 && (
            <polygon
              points={`${pointsArr[0].x},${chartHeight - paddingBottom} ${polylineStr} ${pointsArr[pointsArr.length - 1].x},${chartHeight - paddingBottom}`}
              fill="url(#lineAreaGrad)"
            />
          )}

          {/* Polyline */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />

          {/* Points & Value Numbers */}
          {pointsArr.map((pt, i) => {
            const isHov = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHov ? 6 : 4}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {/* Number shown above point */}
                {pt.value > 0 && (
                  <AnimatedSvgNumber
                    value={pt.value}
                    prefix="₹"
                    x={pt.x}
                    y={pt.y - 8}
                    textAnchor="middle"
                    fill="#10b981"
                    fontSize="11px"
                    fontWeight="700"
                  />
                )}
                {/* X axis period label */}
                <text
                  x={pt.x}
                  y={chartHeight - paddingBottom + 20}
                  textAnchor="end"
                  className="axis-label"
                  fill="#6b7280"
                  fontSize="10px"
                  transform={`rotate(-45 ${pt.x} ${chartHeight - paddingBottom + 20})`}
                >
                  {pt.name && pt.name.length === 10 ? pt.name.substring(5) : pt.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default LineChartCard;
