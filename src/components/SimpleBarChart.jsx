import React, { useState } from 'react';
import AnimatedSvgNumber from './AnimatedSvgNumber';
import './SimpleBarChart.css';

const fmtVal = (n) => {
  const v = Number(n) || 0;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${v.toLocaleString()}`;
};

const fmtFull = (n) => `₹${(Number(n) || 0).toLocaleString()}`;

const SimpleBarChart = ({ data }) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-card simple-bar-card">
        <h3 className="chart-card-title">Revenue vs Due Comparison</h3>
        <div className="no-data">No data to display for selected filters</div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => Number(d.revenue || d.totalEarning || 0)));
  const maxDue = Math.max(...data.map(d => Number(d.due || d.totalDue || 0)));
  const maxVal = Math.max(maxRevenue, maxDue, 100);

  const chartHeight = 140;
  const paddingLeft = 44;
  const paddingRight = 20;
  const paddingTop = 26;
  const paddingBottom = 34;
  const availableHeight = chartHeight - paddingTop - paddingBottom;

  const barWidth = Math.min(20, Math.max(10, Math.floor(240 / (data.length * 2 + 1))));
  const groupMargin = Math.min(20, Math.max(8, Math.floor(130 / (data.length + 1))));
  const chartWidth = Math.max(260, data.length * (barWidth * 2 + groupMargin) + paddingLeft + paddingRight);

  // Y-axis grid ticks (0, 50%, 100%)
  const yTicks = [
    { label: '0', y: chartHeight - paddingBottom },
    { label: fmtVal(Math.round(maxVal / 2)), y: chartHeight - paddingBottom - availableHeight / 2 },
    { label: fmtVal(Math.round(maxVal)), y: paddingTop },
  ];

  return (
    <div className="chart-card simple-bar-card">
      <div className="simple-bar-header">
        <div>
          <h3 className="chart-card-title">Revenue vs Due Comparison</h3>
          <span className="chart-subtitle">Real-time collections and outstanding</span>
        </div>
        <div className="bar-legend-chips">
          <div className="legend-chip paid">
            <span className="color-indicator revenue"></span>
            <span>Paid</span>
          </div>
          <div className="legend-chip due">
            <span className="color-indicator due"></span>
            <span>Due</span>
          </div>
        </div>
      </div>

      <div className="bar-chart-scroll-wrap">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="simple-bar-svg" style={{ minWidth: `${chartWidth}px` }}>
          <defs>
            <linearGradient id="paidBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="dueBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y labels */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="var(--border-color, #e2e8f0)"
                strokeDasharray={idx === 0 ? "none" : "3,3"}
                opacity="0.6"
              />
              <text
                x={paddingLeft - 6}
                y={tick.y + 3.5}
                textAnchor="end"
                className="axis-number-label"
                fill="var(--text-muted, #94a3b8)"
                fontSize="9.5px"
                fontWeight="500"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* X Axis line */}
          <line
            x1={paddingLeft}
            y1={chartHeight - paddingBottom}
            x2={chartWidth - paddingRight}
            y2={chartHeight - paddingBottom}
            stroke="var(--border-color, #cbd5e1)"
            strokeWidth="1.2"
          />

          {/* Bars */}
          <g transform={`translate(${paddingLeft}, 0)`}>
            {data.map((d, i) => {
              const revenue = Number(d.revenue || d.totalEarning || 0);
              const due = Number(d.due || d.totalDue || 0);
              const revenueHeight = maxVal > 0 ? (revenue / maxVal) * availableHeight : 0;
              const dueHeight = maxVal > 0 ? (due / maxVal) * availableHeight : 0;

              const x1 = i * (barWidth * 2 + groupMargin) + 6;
              const x2 = x1 + barWidth + 3;

              const revY = chartHeight - paddingBottom - revenueHeight;
              const dueY = chartHeight - paddingBottom - dueHeight;

              const isHovered = hoveredBar === i;

              return (
                <g
                  key={d.period || i}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Revenue Bar */}
                  <rect
                    x={x1}
                    y={revY}
                    width={barWidth}
                    height={Math.max(revenueHeight, 3)}
                    rx="3"
                    fill="url(#paidBarGrad)"
                    className="bar-rect"
                    opacity={isHovered ? 1 : 0.9}
                  />
                  {/* Revenue Value (Animated) */}
                  {revenue > 0 && (
                    <AnimatedSvgNumber
                      value={revenue}
                      prefix="₹"
                      x={x1 + barWidth / 2}
                      y={revY - 5}
                      textAnchor="middle"
                      fill="#10b981"
                      fontSize="9.5px"
                      fontWeight="600"
                    />
                  )}

                  {/* Due Bar */}
                  <rect
                    x={x2}
                    y={dueY}
                    width={barWidth}
                    height={Math.max(dueHeight, 3)}
                    rx="3"
                    fill="url(#dueBarGrad)"
                    className="bar-rect"
                    opacity={isHovered ? 1 : 0.9}
                  />
                  {/* Due Value (Animated) */}
                  {due > 0 && (
                    <AnimatedSvgNumber
                      value={due}
                      prefix="₹"
                      x={x2 + barWidth / 2}
                      y={dueY - 5}
                      textAnchor="middle"
                      fill="#ef4444"
                      fontSize="9.5px"
                      fontWeight="600"
                    />
                  )}

                  {/* X Axis Period Label */}
                  <text
                    x={x1 + barWidth}
                    y={chartHeight - paddingBottom + 14}
                    textAnchor="middle"
                    className={`bar-period-label ${isHovered ? 'active' : ''}`}
                    fill="var(--text-muted, #64748b)"
                    fontSize="9.5px"
                    fontWeight={isHovered ? '700' : '500'}
                  >
                    {d.period && d.period.length === 10 ? d.period.substring(5) : d.period}
                  </text>

                  {/* Hover tooltip */}
                  {isHovered && (
                    <g transform={`translate(${x1 + barWidth - 55}, ${Math.max(2, Math.min(revY, dueY) - 44)})`}>
                      <rect
                        width="110"
                        height="38"
                        rx="6"
                        fill="var(--bg-card, #1e293b)"
                        stroke="var(--border-color, #334155)"
                        strokeWidth="1"
                        style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}
                      />
                      <text x="55" y="14" textAnchor="middle" fill="var(--text-main, #fff)" fontSize="9px" fontWeight="700">
                        {d.period}
                      </text>
                      <text x="55" y="28" textAnchor="middle" fill="#34d399" fontSize="9px" fontWeight="600">
                        Paid: {fmtFull(revenue)} | <tspan fill="#f87171">Due: {fmtFull(due)}</tspan>
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default SimpleBarChart;
