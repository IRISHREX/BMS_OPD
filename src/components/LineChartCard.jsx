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
      <div className="chart-card line-chart-card">
        <h3 className="chart-card-title">{title}</h3>
        <div className="no-data">No data to display</div>
      </div>
    );
  }

  const chartHeight = 140;
  const paddingLeft = 40;
  const paddingRight = 25;
  const paddingTop = 26;
  const paddingBottom = 34;
  const availableHeight = chartHeight - paddingTop - paddingBottom;
  const chartWidth = Math.max(250, data.length * 48);

  const maxVal = Math.max(...data.map(d => Number(d.value) || 0), 100);
  const pointGap = data.length > 1 ? (chartWidth - paddingLeft - paddingRight) / (data.length - 1) : 0;

  const pointsArr = data.map((item, i) => {
    const x = i * pointGap + paddingLeft;
    const val = Number(item.value) || 0;
    const y = (chartHeight - paddingBottom) - (val / maxVal) * availableHeight;
    return { x, y, name: item.name, value: val };
  });

  const polylineStr = pointsArr.map(p => `${p.x},${p.y}`).join(' ');
  const totalRevenue = data.reduce((s, it) => s + (Number(it.value) || 0), 0);

  return (
    <div className="chart-card line-chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">{title}</h3>
          <span className="chart-card-sub">Daily collections overview</span>
        </div>
        <span className="chart-card-badge">
          Total: <CountUp end={totalRevenue} separator="," prefix="₹" duration={1.5} />
        </span>
      </div>

      <div className="line-chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight} className="line-chart-svg">
          <defs>
            <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent, #10b981)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent, #10b981)" stopOpacity="0.0" />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--accent, #10b981)" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={chartWidth - paddingRight}
            y2={paddingTop}
            stroke="var(--border-color, #e2e8f0)"
            strokeDasharray="3,3"
            opacity="0.6"
          />
          <line
            x1={paddingLeft}
            y1={chartHeight - paddingBottom}
            x2={chartWidth - paddingRight}
            y2={chartHeight - paddingBottom}
            stroke="var(--border-color, #cbd5e1)"
            strokeWidth="1.2"
          />

          {/* Area Fill under curve */}
          {pointsArr.length > 1 && (
            <polygon
              points={`${pointsArr[0].x},${chartHeight - paddingBottom} ${polylineStr} ${pointsArr[pointsArr.length - 1].x},${chartHeight - paddingBottom}`}
              fill="url(#lineAreaGradient)"
            />
          )}

          {/* Trend Polyline */}
          <polyline
            fill="none"
            stroke="var(--accent, #10b981)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
            filter="url(#lineGlow)"
          />

          {/* Points & Hover Interactions */}
          {pointsArr.map((pt, i) => {
            const isHov = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Vertical hover guide line */}
                {isHov && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={chartHeight - paddingBottom}
                    stroke="var(--accent, #10b981)"
                    strokeDasharray="2,2"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                )}

                {/* Point circle marker */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHov ? 6 : 4}
                  fill="var(--accent, #10b981)"
                  stroke="var(--bg-card, #ffffff)"
                  strokeWidth="2"
                  style={{ transition: 'r 0.15s ease' }}
                />

                {/* Amount label */}
                {pt.value > 0 && (
                  <AnimatedSvgNumber
                    value={pt.value}
                    prefix="₹"
                    x={pt.x}
                    y={pt.y - 8}
                    textAnchor="middle"
                    fill="var(--accent, #10b981)"
                    fontSize="10px"
                    fontWeight="700"
                  />
                )}

                {/* Date label on X axis */}
                <text
                  x={pt.x}
                  y={chartHeight - paddingBottom + 14}
                  textAnchor="middle"
                  className={`axis-date-label ${isHov ? 'active' : ''}`}
                  fill="var(--text-muted, #64748b)"
                  fontSize="9.5px"
                  fontWeight={isHov ? '700' : '500'}
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
