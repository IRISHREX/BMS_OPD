import React from 'react';
import './ChartCards.css';

const PieChartCard = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <div className="no-data">No data to display</div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1'];
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  let startAngle = 0;
  const slices = data.map((item, index) => {
    const val = Number(item.value) || 0;
    if (total === 0 || val === 0) return null;
    const angle = (val / total) * 360;
    const largeArcFlag = angle > 180 ? 1 : 0;
    const rad1 = (Math.PI * startAngle) / 180;
    const x1 = 50 + 40 * Math.cos(rad1);
    const y1 = 50 + 40 * Math.sin(rad1);
    startAngle += angle;
    const rad2 = (Math.PI * startAngle) / 180;
    const x2 = 50 + 40 * Math.cos(rad2);
    const y2 = 50 + 40 * Math.sin(rad2);

    // If slice covers entire circle
    if (angle >= 359.99) {
      return (
        <circle
          key={item.name}
          cx="50"
          cy="50"
          r="40"
          fill={COLORS[index % COLORS.length]}
        />
      );
    }

    const pathData = `M 50,50 L ${x1},${y1} A 40,40 0 ${largeArcFlag},1 ${x2},${y2} Z`;
    return (
      <path
        key={item.name}
        d={pathData}
        fill={COLORS[index % COLORS.length]}
        stroke="#ffffff"
        strokeWidth="1.5"
      />
    );
  });

  return (
    <div className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <h3>{title}</h3>
        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
          Total: ₹{total.toLocaleString()}
        </span>
      </div>
      <div className="pie-chart-container">
        <svg viewBox="0 0 100 100" width="130" height="130">
          {total > 0 ? (
            slices
          ) : (
            <circle cx="50" cy="50" r="40" fill="#e5e7eb" />
          )}
        </svg>
        <div className="legend" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map((item, index) => {
            const val = Number(item.value) || 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return (
              <div key={item.name} className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  className="color-box"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length],
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    flexShrink: 0
                  }}
                ></div>
                <div style={{ fontSize: '12px', lineHeight: 1.2 }}>
                  <strong>{item.name}:</strong> ₹{val.toLocaleString()} <span style={{ color: '#6b7280', fontSize: '11px' }}>({pct}%)</span>
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
