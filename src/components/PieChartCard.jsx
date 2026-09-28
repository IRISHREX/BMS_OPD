import React, { useState } from 'react';
import CountUp from 'react-countup';
import './ChartCards.css';

const PieChartCard = ({ data, title }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-card-title">{title}</h3>
        <div className="no-data">No data to display</div>
      </div>
    );
  }

  // Clinical color palette: Paid (Emerald), Due (Coral/Red), Refund (Sky Blue), Other (Amber)
  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  // Calculate Donut Slices (Outer radius 40, Inner radius 25)
  let startAngle = 0;
  const outerR = 40;
  const innerR = 25;
  const cx = 50;
  const cy = 50;

  const slices = data.map((item, index) => {
    const val = Number(item.value) || 0;
    if (total === 0 || val === 0) return null;
    const angle = (val / total) * 360;
    const isFull = angle >= 359.99;
    const isHovered = hoveredIdx === index;

    if (isFull) {
      return (
        <path
          key={item.name}
          d={`M ${cx},${cy - outerR} A ${outerR},${outerR} 0 1,1 ${cx - 0.01},${cy - outerR} L ${cx - 0.01},${cy - innerR} A ${innerR},${innerR} 0 1,0 ${cx},${cy - innerR} Z`}
          fill={COLORS[index % COLORS.length]}
          className="donut-slice"
          style={{
            transform: isHovered ? 'scale(1.04)' : 'scale(1)',
            transformOrigin: '50px 50px',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            opacity: isHovered ? 1 : 0.92,
            cursor: 'pointer'
          }}
          onMouseEnter={() => setHoveredIdx(index)}
          onMouseLeave={() => setHoveredIdx(null)}
        />
      );
    }

    const largeArcFlag = angle > 180 ? 1 : 0;
    const rad1 = (Math.PI * (startAngle - 90)) / 180;
    const x1Outer = cx + outerR * Math.cos(rad1);
    const y1Outer = cy + outerR * Math.sin(rad1);
    const x1Inner = cx + innerR * Math.cos(rad1);
    const y1Inner = cy + innerR * Math.sin(rad1);

    startAngle += angle;
    const rad2 = (Math.PI * (startAngle - 90)) / 180;
    const x2Outer = cx + outerR * Math.cos(rad2);
    const y2Outer = cy + outerR * Math.sin(rad2);
    const x2Inner = cx + innerR * Math.cos(rad2);
    const y2Inner = cy + innerR * Math.sin(rad2);

    const pathData = `
      M ${x1Outer},${y1Outer}
      A ${outerR},${outerR} 0 ${largeArcFlag},1 ${x2Outer},${y2Outer}
      L ${x2Inner},${y2Inner}
      A ${innerR},${innerR} 0 ${largeArcFlag},0 ${x1Inner},${y1Inner}
      Z
    `;

    return (
      <path
        key={item.name}
        d={pathData}
        fill={COLORS[index % COLORS.length]}
        className="donut-slice"
        style={{
          transform: isHovered ? 'scale(1.04)' : 'scale(1)',
          transformOrigin: '50px 50px',
          transition: 'transform 0.2s ease, opacity 0.2s ease',
          opacity: isHovered ? 1 : 0.92,
          cursor: 'pointer'
        }}
        onMouseEnter={() => setHoveredIdx(index)}
        onMouseLeave={() => setHoveredIdx(null)}
      />
    );
  });

  return (
    <div className="chart-card pie-chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
        <span className="chart-card-badge">
          Total: <CountUp end={total} separator="," prefix="₹" duration={1.5} />
        </span>
      </div>

      <div className="pie-chart-container">
        <div className="donut-wrapper">
          <svg viewBox="0 0 100 100" width="120" height="120" className="donut-svg">
            {total > 0 ? (
              slices
            ) : (
              <circle cx="50" cy="50" r="35" fill="none" stroke="var(--border-color, #e2e8f0)" strokeWidth="15" />
            )}
          </svg>
          <div className="donut-center-stat">
            <span className="center-stat-val">₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}</span>
            <span className="center-stat-lbl">Total</span>
          </div>
        </div>

        <div className="chart-legend-col">
          {data.map((item, index) => {
            const val = Number(item.value) || 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            const isHovered = hoveredIdx === index;
            return (
              <div
                key={item.name}
                className={`legend-pill-item ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <span
                  className="legend-dot"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="legend-info">
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-val">
                    <CountUp end={val} separator="," prefix="₹" duration={1.5} />
                    <span className="legend-pct">({pct}%)</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PieChartCard;
