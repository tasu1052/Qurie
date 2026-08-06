import React from 'react';
/** Line chart (SVG). series: [{name,values:number[],accent?}] — ink primary, indigo accent series. */
export function LineChart({
  series = [],
  labels = [],
  height = 180,
  width = '100%',
  showDots = true,
  yAxisLabel = null,
  xAxisLabel = null,
  style = {},
}) {
  const W = 600;
  const H = 200;
  const PL = 36;
  const PR = 8;
  const PT = 16;
  const PB = 28;
  const all = series.flatMap((s) => s.values);
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const x = (i) => PL + i * (plotW / Math.max((labels.length || series[0]?.values.length || 2) - 1, 1));
  const y = (v) => PT + plotH - ((v - min) / (max - min || 1)) * plotH;
  const path = (vals) =>
    vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const ticks = [0, 0.5, 1].map((t) => min + t * (max - min));

  return (
    <div style={{ fontFamily: 'var(--font-sans)', ...style }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width, height, display: 'block' }} preserveAspectRatio="none">
        {ticks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PL}
              x2={W - PR}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--chart-grid)"
              strokeWidth="1"
            />
            <text
              x={PL - 6}
              y={y(tick) + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-muted)"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}
        {series.map((s, si) => (
          <g key={si}>
            <path
              d={path(s.values)}
              fill="none"
              stroke={s.accent ? 'var(--chart-accent)' : 'var(--chart-primary)'}
              strokeWidth={s.accent ? 2.5 : 2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {showDots &&
              s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r="3"
                  fill={s.accent ? 'var(--chart-accent)' : 'var(--chart-primary)'}
                  stroke="var(--surface-card)"
                  strokeWidth="1.5"
                />
              ))}
          </g>
        ))}
      </svg>
      {labels.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: `4px ${PR}px 0 ${PL}px`,
            fontSize: 11,
            color: 'var(--text-muted)',
            gap: 4,
          }}
        >
          {labels.map((l, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                textAlign: i === 0 ? 'left' : i === labels.length - 1 ? 'right' : 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={String(l)}
            >
              {l}
            </span>
          ))}
        </div>
      )}
      {(xAxisLabel || yAxisLabel) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 11,
            color: 'var(--text-secondary)',
            gap: 8,
          }}
        >
          <span>{yAxisLabel ? `Y: ${yAxisLabel}` : ''}</span>
          <span>{xAxisLabel ? `X: ${xAxisLabel}` : ''}</span>
        </div>
      )}
    </div>
  );
}
