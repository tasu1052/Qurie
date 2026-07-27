/* @ds-bundle: {"format":4,"namespace":"QurieDesignSystem_1efd37","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"Badge","sourcePath":"components/badges/Badge.jsx"},{"name":"BarChart","sourcePath":"components/charts/BarChart.jsx"},{"name":"DonutChart","sourcePath":"components/charts/DonutChart.jsx"},{"name":"LineChart","sourcePath":"components/charts/LineChart.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"StatCardRow","sourcePath":"components/data/StatCardRow.jsx"},{"name":"ChartLegend","sourcePath":"components/charts/ChartLegend.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Timer","sourcePath":"components/feedback/Timer.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Chevron","sourcePath":"components/navigation/Chevron.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Topbar","sourcePath":"components/navigation/Topbar.jsx"},{"name":"Modal","sourcePath":"components/overlays/Modal.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"ff19c8e7385a","components/badges/Badge.jsx":"f55b800bff4d","components/charts/BarChart.jsx":"121283a124c7","components/charts/DonutChart.jsx":"4f4742341a56","components/charts/LineChart.jsx":"7359822c3350","components/data/DataTable.jsx":"f875672bdcb3","components/data/StatCard.jsx":"aa82087cb835","components/feedback/EmptyState.jsx":"8fbde5945e14","components/feedback/Timer.jsx":"411da9f578b9","components/forms/Input.jsx":"f933847d11af","components/forms/Select.jsx":"e54413bb6485","components/navigation/Chevron.jsx":"91559df9cfdd","components/navigation/Sidebar.jsx":"d92eeace89af","components/navigation/Topbar.jsx":"ec5486017c29","components/overlays/Modal.jsx":"34b6db145e93","ui_kits/admin/AdminApp.jsx":"d05aa3ae75a4","ui_kits/enterprise/EnterpriseApp.jsx":"2db34c293b73","ui_kits/workspace/WorkspaceApp.jsx":"b5670e9c86c0"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.QurieDesignSystem_1efd37 = window.QurieDesignSystem_1efd37 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon = null,
  children,
  onClick,
  style = {}
}) {
  const base = {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    borderRadius: 'var(--radius-control)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid transparent',
    transition: 'background 140ms ease-out,border-color 140ms ease-out',
    lineHeight: 1,
    whiteSpace: 'nowrap'
  };
  const sizes = {
    sm: {
      fontSize: 13,
      padding: '7px 14px',
      minHeight: 'var(--control-h-sm)'
    },
    md: {
      fontSize: 14,
      padding: '10px 18px',
      minHeight: 'var(--control-h-md)'
    }
  };
  const variants = {
    primary: {
      background: 'var(--ink)',
      color: 'var(--text-inverse)'
    },
    secondary: {
      background: 'var(--surface-card)',
      color: 'var(--ink)',
      borderColor: 'var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)'
    },
    accent: {
      background: 'var(--accent)',
      color: 'var(--text-inverse)'
    }
  };
  const dis = disabled ? {
    opacity: 0.45,
    pointerEvents: 'none'
  } : {};
  const [hover, setHover] = React.useState(false);
  const hov = hover && !disabled ? {
    primary: {
      background: 'var(--grey-600)'
    },
    secondary: {
      background: 'var(--surface-hover)'
    },
    ghost: {
      background: 'var(--surface-hover)',
      color: 'var(--ink)'
    },
    accent: {
      background: 'var(--accent-strong)'
    }
  }[variant] : {};
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...sizes[size],
      ...variants[variant],
      ...hov,
      ...dis,
      ...style
    }
  }, icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/badges/Badge.jsx
try { (() => {
function Badge({
  status = 'neutral',
  children,
  style = {}
}) {
  const map = {
    success: ['var(--status-success)', 'var(--status-success-bg)'],
    warning: ['var(--status-warning)', 'var(--status-warning-bg)'],
    error: ['var(--status-error)', 'var(--status-error-bg)'],
    neutral: ['var(--status-neutral)', 'var(--status-neutral-bg)'],
    accent: ['var(--status-accent)', 'var(--status-accent-bg)'],
    ink: ['var(--text-inverse)', 'var(--ink)']
  };
  const [fg, bg] = map[status] || map.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: bg,
      color: fg,
      borderRadius: 'var(--radius-pill)',
      padding: '3px 10px',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      fontFamily: 'var(--font-sans)',
      lineHeight: 1.5,
      whiteSpace: 'nowrap',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badges/Badge.jsx", error: String((e && e.message) || e) }); }

// components/charts/BarChart.jsx
try { (() => {
/** Vertical bar chart, ink bars with single indigo highlight.
 * data: [{label,value,highlight?}] */
function BarChart({
  data = [],
  height = 180,
  maxValue = null,
  showValues = false,
  style = {}
}) {
  const max = maxValue ?? Math.max(...data.map(d => d.value), 1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 12,
      height,
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      height: '100%',
      justifyContent: 'flex-end'
    }
  }, showValues && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: d.highlight ? 'var(--accent)' : 'var(--text-secondary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, d.value), /*#__PURE__*/React.createElement("div", {
    title: `${d.label}: ${d.value}`,
    style: {
      width: '100%',
      maxWidth: 36,
      height: `${Math.max(2, d.value / max * 100)}%`,
      background: d.highlight ? 'var(--chart-accent)' : 'var(--chart-primary)',
      borderRadius: '6px 6px 0 0',
      transition: 'height 300ms ease-out'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap'
    }
  }, d.label))));
}
Object.assign(__ds_scope, { BarChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/BarChart.jsx", error: String((e && e.message) || e) }); }

// components/charts/DonutChart.jsx
try { (() => {
/** Donut/ring chart. segments: [{label,value,accent?}] — accent segment indigo, rest ink/grays. */
function DonutChart({
  segments = [],
  size = 140,
  thickness = 16,
  centerValue = null,
  centerLabel = null,
  style = {}
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = (100 - thickness) / 2,
    C = 2 * Math.PI * R;
  const palette = ['var(--chart-primary)', 'var(--grey-400)', 'var(--grey-200)', 'var(--grey-100)'];
  let offset = 0,
    gi = 0;
  const segs = segments.map(s => {
    const frac = s.value / total;
    const seg = {
      ...s,
      frac,
      offset,
      color: s.accent ? 'var(--chart-accent)' : palette[gi++ % palette.length]
    };
    offset += frac;
    return seg;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 20,
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    style: {
      width: size,
      height: size,
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: R,
    fill: "none",
    stroke: "var(--chart-grid)",
    strokeWidth: thickness
  }), segs.map((s, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: "50",
    cy: "50",
    r: R,
    fill: "none",
    stroke: s.color,
    strokeWidth: thickness,
    strokeDasharray: `${Math.max(s.frac * C - 1.5, 0)} ${C}`,
    strokeDashoffset: -s.offset * C,
    strokeLinecap: "butt"
  }))), centerValue != null && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size * 0.17,
      fontWeight: 700,
      color: 'var(--ink)',
      lineHeight: 1.1,
      fontVariantNumeric: 'tabular-nums'
    }
  }, centerValue), centerLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size * 0.075,
      color: 'var(--text-muted)'
    }
  }, centerLabel))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      flexShrink: 0
    }
  }, segs.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: s.color,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)',
      whiteSpace: 'nowrap'
    }
  }, s.label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontVariantNumeric: 'tabular-nums',
      marginLeft: 'auto'
    }
  }, Math.round(s.frac * 100), "%")))));
}
Object.assign(__ds_scope, { DonutChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/DonutChart.jsx", error: String((e && e.message) || e) }); }

// components/charts/LineChart.jsx
try { (() => {
/** Line chart (SVG). series: [{name,values:number[],accent?}] — ink primary, indigo accent series. */
function LineChart({
  series = [],
  labels = [],
  height = 180,
  width = '100%',
  showDots = true,
  style = {}
}) {
  const W = 600,
    H = 200,
    PX = 8,
    PY = 16;
  const all = series.flatMap(s => s.values);
  const max = Math.max(...all, 1),
    min = Math.min(...all, 0);
  const x = i => PX + i * ((W - 2 * PX) / Math.max((labels.length || series[0]?.values.length || 2) - 1, 1));
  const y = v => H - PY - (v - min) / (max - min || 1) * (H - 2 * PY);
  const path = vals => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    style: {
      width,
      height,
      display: 'block'
    },
    preserveAspectRatio: "none"
  }, [0.25, 0.5, 0.75].map(t => /*#__PURE__*/React.createElement("line", {
    key: t,
    x1: PX,
    x2: W - PX,
    y1: PY + t * (H - 2 * PY),
    y2: PY + t * (H - 2 * PY),
    stroke: "var(--chart-grid)",
    strokeWidth: "1"
  })), series.map((s, si) => /*#__PURE__*/React.createElement("g", {
    key: si
  }, /*#__PURE__*/React.createElement("path", {
    d: path(s.values),
    fill: "none",
    stroke: s.accent ? 'var(--chart-accent)' : 'var(--chart-primary)',
    strokeWidth: s.accent ? 2.5 : 2,
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }), showDots && s.values.map((v, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: x(i),
    cy: y(v),
    r: "3",
    fill: s.accent ? 'var(--chart-accent)' : 'var(--chart-primary)',
    stroke: "var(--surface-card)",
    strokeWidth: "1.5"
  }))))), labels.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: `4px ${PX}px 0`,
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, labels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, l))));
}
Object.assign(__ds_scope, { LineChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/LineChart.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
/** Data table: sortable headers, thin row dividers, hover rows. Dense by design — not Maia-loose.
 * columns: [{key,label,sortable,align,width,render(row)}]  rows: object[] */
function DataTable({
  columns = [],
  rows = [],
  rowKey = 'id',
  onRowClick = null,
  style = {}
}) {
  const [sort, setSort] = React.useState(null);
  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const s = [...rows].sort((a, b) => {
      const av = a[sort.key],
        bv = b[sort.key];
      return (av > bv ? 1 : av < bv ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1);
    });
    return s;
  }, [rows, sort]);
  const th = {
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 'var(--ls-caps)',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    padding: '10px 16px',
    borderBottom: '1px solid var(--border-strong)',
    whiteSpace: 'nowrap',
    userSelect: 'none'
  };
  return /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      background: 'var(--surface-card)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    onClick: () => {
      if (!c.sortable) return;
      setSort(s => s && s.key === c.key ? {
        key: c.key,
        dir: s.dir === 'asc' ? 'desc' : 'asc'
      } : {
        key: c.key,
        dir: 'asc'
      });
    },
    style: {
      ...th,
      textAlign: c.align || 'left',
      width: c.width,
      cursor: c.sortable ? 'pointer' : 'default',
      color: sort && sort.key === c.key ? 'var(--accent)' : th.color
    }
  }, c.label, c.sortable && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 4,
      fontSize: 9,
      opacity: sort && sort.key === c.key ? 1 : 0.4
    }
  }, sort && sort.key === c.key ? sort.dir === 'asc' ? '▲' : '▼' : '▲'))))), /*#__PURE__*/React.createElement("tbody", null, sorted.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r[rowKey] ?? i,
    onClick: onRowClick ? () => onRowClick(r) : undefined,
    style: {
      cursor: onRowClick ? 'pointer' : 'default'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--surface-hover)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      padding: 'var(--table-cell-pad)',
      borderBottom: '1px solid var(--divider)',
      color: 'var(--text-body)',
      textAlign: c.align || 'left',
      verticalAlign: 'middle'
    }
  }, c.render ? c.render(r) : r[c.key]))))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
function StatCard({
  icon = null,
  label,
  value,
  delta = null,
  deltaDirection = null,
  caption = null,
  accent = false,
  style = {}
}) {
  const dir = delta == null ? null : deltaDirection === 'up' || deltaDirection === 'down' ? deltaDirection : String(delta).trim().charAt(0) === '-' ? 'down' : 'up';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--shadow-card)',
      backdropFilter: 'var(--surface-blur)',
      WebkitBackdropFilter: 'var(--surface-blur)',
      padding: 'var(--stat-card-padding)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 0,
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-md)',
      background: accent ? 'var(--accent-soft)' : 'var(--surface-sunken)',
      color: accent ? 'var(--accent)' : 'var(--text-secondary)'
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-kpi)',
      fontWeight: 700,
      color: accent ? 'var(--accent)' : 'var(--ink)',
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
      fontVariantNumeric: 'tabular-nums'
    }
  }, value), dir && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: dir === 'up' ? 'var(--status-success)' : 'var(--status-error)',
      whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums'
    }
  }, dir === 'up' ? '↑' : '↓', "\u2009", delta)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--text-secondary)',
      fontWeight: 500
    }
  }, label), caption && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, caption)));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCardRow.jsx
try { (() => {
function StatCardRow({ items = null, minWidth = 250, gap = 24, children = null, style = {} }) {
  const ref = React.useRef(null);
  const [can, setCan] = React.useState({ l: false, r: false });
  const update = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCan(c => {
      const l = el.scrollLeft > 4, r = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      return c.l === l && c.r === r ? c : { l, r };
    });
  }, []);
  React.useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro) ro.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    return () => { if (ro) ro.disconnect(); el.removeEventListener('scroll', update); };
  }, [update]);
  const nudge = d => { const el = ref.current; if (el) el.scrollBy({ left: d * (minWidth + gap), behavior: 'smooth' }); };
  const arrow = d => React.createElement("button", {
    key: d,
    onClick: () => nudge(d),
    "aria-label": d > 0 ? '다음 카드' : '이전 카드',
    style: Object.assign({ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-card)', color: 'var(--accent)', fontSize: 17, fontWeight: 700, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontFamily: 'var(--font-sans)', padding: 0 }, d > 0 ? { right: -10 } : { left: -10 })
  }, d > 0 ? '\u203A' : '\u2039');
  const kids = children || (items || []).map((it, i) => React.createElement(__ds_scope.StatCard, Object.assign({ key: i }, it)));
  return React.createElement("div", { style: Object.assign({ position: 'relative', minWidth: 0 }, style) },
    React.createElement("div", { ref: ref, style: { display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(' + minWidth + 'px, 1fr)', gap: gap, overflowX: 'auto', scrollbarWidth: 'none' } }, kids),
    can.l && arrow(-1), can.r && arrow(1));
}
Object.assign(__ds_scope, { StatCardRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCardRow.jsx", error: String((e && e.message) || e) }); }

// components/charts/ChartLegend.jsx
try { (() => {
function ChartLegend({ items = [], align = 'left', style = {} }) {
  const jc = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  const palette = ['var(--chart-primary)', 'var(--grey-400)', 'var(--grey-200)', 'var(--grey-100)'];
  let gi = 0;
  return React.createElement("div", { style: Object.assign({ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: jc, fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }, style) },
    items.map((it, i) => React.createElement("span", { key: i, style: { display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' } },
      React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: it.color || (it.accent ? 'var(--chart-accent)' : palette[gi++ % palette.length]), flexShrink: 0 } }),
      it.label)));
}
Object.assign(__ds_scope, { ChartLegend });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/ChartLegend.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
function Footer({ year = 2026, note = '현재 데모 버전', style = {} }) {
  return React.createElement("footer", { style: Object.assign({ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }, style) },
    React.createElement("span", { style: { fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '-0.01em' } }, "Q", React.createElement("span", { style: { color: 'var(--accent)', fontWeight: 800 } }, ">"), "rie"),
    React.createElement("span", null, "\u00A9 ", year, " Qurie \u00B7 ", note));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function EmptyState({
  message,
  description = null,
  actionLabel = null,
  onAction,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '48px 24px',
      textAlign: 'center',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, message), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)',
      maxWidth: 340,
      lineHeight: 1.55
    }
  }, description), actionLabel && /*#__PURE__*/React.createElement("button", {
    onClick: onAction,
    style: {
      marginTop: 12,
      background: 'var(--ink)',
      color: 'var(--text-inverse)',
      border: 'none',
      borderRadius: 'var(--radius-control)',
      padding: '10px 18px',
      fontSize: 14,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      cursor: 'pointer'
    }
  }, actionLabel));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Timer.jsx
try { (() => {
/** Calm circular countdown for the AI quiz flow. Indigo sweep, no alarming colors. */
function Timer({
  totalSeconds = 60,
  remainingSeconds = null,
  running = false,
  size = 64,
  variant = 'ring',
  label = null,
  onComplete,
  style = {}
}) {
  const [internal, setInternal] = React.useState(remainingSeconds ?? totalSeconds);
  const remaining = remainingSeconds ?? internal;
  React.useEffect(() => {
    if (remainingSeconds != null || !running) return;
    const t = setInterval(() => setInternal(r => {
      if (r <= 1) {
        clearInterval(t);
        onComplete && onComplete();
        return 0;
      }
      return r - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [running, remainingSeconds]);
  const frac = Math.max(0, Math.min(1, remaining / totalSeconds));
  const mm = Math.floor(remaining / 60),
    ss = String(remaining % 60).padStart(2, '0');
  const text = remaining >= 60 ? `${mm}:${ss}` : `${remaining}`;
  if (variant === 'bar') return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      minWidth: 160,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, label ?? '남은 시간'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      color: 'var(--ink)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, mm, ":", ss)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 3,
      background: 'var(--chart-grid)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${frac * 100}%`,
      background: 'var(--accent)',
      borderRadius: 3,
      transition: 'width 950ms linear'
    }
  })));
  const R = 42,
    C = 2 * Math.PI * R;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    style: {
      width: size,
      height: size,
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: R,
    fill: "none",
    stroke: "var(--chart-grid)",
    strokeWidth: "8"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: R,
    fill: "none",
    stroke: "var(--accent)",
    strokeWidth: "8",
    strokeLinecap: "round",
    strokeDasharray: C,
    strokeDashoffset: C * (1 - frac),
    style: {
      transition: 'stroke-dashoffset 950ms linear'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.26,
      fontWeight: 700,
      color: 'var(--ink)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, text)), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, label));
}
Object.assign(__ds_scope, { Timer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Timer.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  shortcut = null,
  icon = null,
  disabled = false,
  width = 260,
  style = {}
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--surface-card)',
      border: `1px solid ${focus ? 'var(--accent)' : 'var(--border-strong)'}`,
      boxShadow: focus ? '0 0 0 2px var(--accent-soft)' : 'none',
      borderRadius: 'var(--radius-control)',
      padding: '0 14px',
      height: 'var(--control-h-md)',
      boxSizing: 'border-box',
      width,
      opacity: disabled ? 0.45 : 1,
      transition: 'border-color 140ms ease-out,box-shadow 140ms ease-out',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      display: 'flex'
    }
  }, icon), /*#__PURE__*/React.createElement("input", {
    type: type,
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      border: 'none',
      outline: 'none',
      background: 'transparent',
      flex: 1,
      minWidth: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--ink)'
    }
  }), shortcut && /*#__PURE__*/React.createElement("kbd", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      color: 'var(--text-muted)',
      background: 'var(--surface-sunken)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-pill)',
      padding: '2px 8px',
      lineHeight: 1.4
    }
  }, shortcut));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  options = [],
  value,
  onChange,
  size = 'md',
  disabled = false,
  style = {}
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const cur = options.find(o => (o.value ?? o) === value) ?? options[0];
  const label = o => o?.label ?? o;
  const pad = size === 'sm' ? '5px 12px' : '8px 16px';
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: 'relative',
      display: 'inline-block',
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    disabled: disabled,
    onClick: () => setOpen(o => !o),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-control)',
      padding: pad,
      fontFamily: 'var(--font-sans)',
      fontSize: size === 'sm' ? 12 : 14,
      fontWeight: 500,
      color: 'var(--ink)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1
    }
  }, label(cur), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontSize: size === 'sm' ? 9 : 10,
      transform: 'rotate(90deg)',
      fontWeight: 600
    }
  }, ">")), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 4px)',
      left: 0,
      minWidth: '100%',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-popover)',
      backdropFilter: 'var(--surface-blur)',
      WebkitBackdropFilter: 'var(--surface-blur)',
      padding: 5,
      zIndex: 30
    }
  }, options.map((o, i) => {
    const v = o.value ?? o;
    const sel = v === value;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: () => {
        setOpen(false);
        onChange && onChange(v);
      },
      style: {
        padding: '6px 12px',
        borderRadius: 'var(--radius-sm)',
        fontSize: size === 'sm' ? 12 : 13,
        fontFamily: 'var(--font-sans)',
        fontWeight: sel ? 600 : 400,
        color: sel ? 'var(--accent)' : 'var(--ink)',
        background: sel ? 'var(--accent-softer)' : 'transparent',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      },
      onMouseEnter: e => {
        if (!sel) e.currentTarget.style.background = 'var(--surface-hover)';
      },
      onMouseLeave: e => {
        if (!sel) e.currentTarget.style.background = 'transparent';
      }
    }, label(o));
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Chevron.jsx
try { (() => {
/** Type-rendered brand chevron ">" — Qurie's signature accent shape. */
function Chevron({
  color = 'var(--accent)',
  size = 14,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      color,
      fontSize: size,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      lineHeight: 1,
      display: 'inline-block',
      ...style
    }
  }, ">");
}
Object.assign(__ds_scope, { Chevron });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Chevron.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
/** Persistent left nav. items: [{key,label,icon,active?,badge?}] — pill-shaped items (Maia). */
function Sidebar({
  items = [],
  activeKey,
  onSelect,
  collapsed = false,
  footer = null,
  logoSrc = null,
  brand = 'Q>rie',
  style = {}
}) {
  const w = collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)';
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      width: w,
      minWidth: w,
      height: '100%',
      background: 'var(--surface-card)',
      backdropFilter: 'var(--surface-blur)',
      WebkitBackdropFilter: 'var(--surface-blur)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      gap: 4,
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      transition: 'width 180ms ease-out',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '4px 10px 16px',
      minHeight: 36
    }
  }, logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: brand,
    style: {
      height: 22,
      objectFit: 'contain',
      objectPosition: 'left'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--ink)',
      letterSpacing: '-0.02em',
      whiteSpace: 'nowrap'
    }
  }, collapsed ? /*#__PURE__*/React.createElement(React.Fragment, null, "Q", /*#__PURE__*/React.createElement(__ds_scope.Chevron, {
    size: 16
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, "Q", /*#__PURE__*/React.createElement(__ds_scope.Chevron, {
    size: 16
  }), "rie"))), items.map(it => {
    const active = it.key === activeKey;
    return /*#__PURE__*/React.createElement("button", {
      key: it.key,
      onClick: () => onSelect && onSelect(it.key),
      title: it.label,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '9px' : '9px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 'var(--radius-pill)',
        border: 'none',
        background: active ? 'var(--accent-softer)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'background 140ms ease-out'
      },
      onMouseEnter: e => {
        if (!active) e.currentTarget.style.background = 'var(--surface-hover)';
      },
      onMouseLeave: e => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        width: 18,
        justifyContent: 'center',
        flexShrink: 0
      }
    }, it.icon), !collapsed && /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, it.label), !collapsed && it.badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted)',
        background: 'var(--surface-sunken)',
        borderRadius: 'var(--radius-pill)',
        padding: '1px 7px'
      }
    }, it.badge));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto'
    }
  }, footer));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Topbar.jsx
try { (() => {
/** Topbar: breadcrumbs (chevron-separated), ⌘K search, actions slot, account chip. */
function Topbar({
  breadcrumbs = [],
  searchPlaceholder = '검색 또는 명령…',
  onSearch,
  actions = null,
  userName = '관리자',
  userRole = null,
  searchIcon = null,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 'var(--topbar-height)',
      background: 'var(--surface-card)',
      backdropFilter: 'var(--surface-blur)',
      WebkitBackdropFilter: 'var(--surface-blur)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 20px',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 14,
      minWidth: 0
    }
  }, breadcrumbs.map((b, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement(__ds_scope.Chevron, {
    size: 11,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: i === breadcrumbs.length - 1 ? 'var(--ink)' : 'var(--text-secondary)',
      fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
      whiteSpace: 'nowrap'
    }
  }, b)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Input, {
    placeholder: searchPlaceholder,
    shortcut: "\u2318K",
    icon: searchIcon,
    onChange: onSearch,
    width: 240
  }), actions, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      padding: '4px 6px',
      borderRadius: 'var(--radius-pill)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: 'var(--accent-soft)',
      color: 'var(--accent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 700
    }
  }, (userName || '?').slice(0, 1)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: 1.2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, userName), userRole && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--text-muted)',
      letterSpacing: 'var(--ls-caps)'
    }
  }, userRole)))));
}
Object.assign(__ds_scope, { Topbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Topbar.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Modal.jsx
try { (() => {
function Modal({
  open = true,
  title,
  description = null,
  children,
  primaryLabel = null,
  secondaryLabel = null,
  onPrimary,
  onSecondary,
  onClose,
  width = 440,
  style = {}
}) {
  if (!open) return null;
  const btn = {
    borderRadius: 'var(--radius-control)',
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer'
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(17,17,17,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-modal)',
      backdropFilter: 'var(--surface-blur)',
      WebkitBackdropFilter: 'var(--surface-blur)',
      width,
      maxWidth: 'calc(100vw - 48px)',
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, title), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      border: 'none',
      background: 'transparent',
      color: 'var(--text-muted)',
      fontSize: 18,
      cursor: 'pointer',
      lineHeight: 1,
      padding: 4
    }
  }, "\xD7")), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: 'var(--text-secondary)',
      lineHeight: 1.55
    }
  }, description)), children, (primaryLabel || secondaryLabel) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 4
    }
  }, secondaryLabel && /*#__PURE__*/React.createElement("button", {
    onClick: onSecondary,
    style: {
      ...btn,
      background: 'var(--surface-card)',
      color: 'var(--ink)',
      border: '1px solid var(--border-strong)'
    }
  }, secondaryLabel), primaryLabel && /*#__PURE__*/React.createElement("button", {
    onClick: onPrimary,
    style: {
      ...btn,
      background: 'var(--ink)',
      color: 'var(--text-inverse)',
      border: '1px solid transparent'
    }
  }, primaryLabel))));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Modal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminApp.jsx
try { (() => {
const NS = window.QurieDesignSystem_1efd37;
const {
  Button,
  Badge,
  Input,
  Select,
  StatCard,
  DataTable,
  BarChart,
  LineChart,
  DonutChart,
  Modal,
  Sidebar,
  Topbar
} = NS;
function LIcon({
  name,
  size = 16
}) {
  return React.createElement('i', {
    ref: el => {
      if (el && !el.dataset.done) {
        el.dataset.done = 1;
        lucide.createIcons({
          attrs: {
            width: size,
            height: size,
            'stroke-width': 1.75
          }
        });
      }
    },
    'data-lucide': name,
    style: {
      display: 'inline-flex',
      width: size,
      height: size
    }
  });
}
function Card({
  title,
  action,
  children,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--shadow-card)',
      backdropFilter: 'var(--surface-blur)',
      WebkitBackdropFilter: 'var(--surface-blur)',
      padding: 'var(--card-padding)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      ...style
    }
  }, (title || action) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, title), action), children);
}
function OverviewView() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "building-2"
    }),
    value: "24",
    label: "\uD65C\uC131 \uC870\uC9C1",
    delta: "+2",
    deltaDirection: "up",
    caption: "\uC774\uBC88 \uB2EC"
  }), /*#__PURE__*/React.createElement(StatCard, {
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "radio"
    }),
    value: "312",
    label: "\uD65C\uC131 \uC138\uC158",
    delta: "+8.1%",
    deltaDirection: "up",
    caption: "\uC9C0\uB09C \uC8FC \uB300\uBE44"
  }), /*#__PURE__*/React.createElement(StatCard, {
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "users"
    }),
    value: "4,820",
    label: "\uC804\uCCB4 \uD559\uC0DD",
    delta: "+3.4%",
    deltaDirection: "up",
    caption: "\uC9C0\uB09C \uC8FC \uB300\uBE44"
  }), /*#__PURE__*/React.createElement(StatCard, {
    accent: true,
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "brain"
    }),
    value: "1,204",
    label: "\uC8FC\uAC04 \uD034\uC988 \uC2E4\uD589",
    delta: "+12.4%",
    deltaDirection: "up",
    caption: "\uC804\uCCB4 \uC870\uC9C1"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "\uC8FC\uAC04 \uC138\uC158 \uC0DD\uC131",
    action: /*#__PURE__*/React.createElement(Select, {
      size: "sm",
      value: "\uCD5C\uADFC 7\uC77C",
      options: ['최근 7일', '최근 30일']
    })
  }, /*#__PURE__*/React.createElement(BarChart, {
    height: 190,
    showValues: true,
    data: [{
      label: '월',
      value: 48
    }, {
      label: '화',
      value: 64
    }, {
      label: '수',
      value: 71,
      highlight: true
    }, {
      label: '목',
      value: 59
    }, {
      label: '금',
      value: 52
    }, {
      label: '토',
      value: 18
    }, {
      label: '일',
      value: 11
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    title: "\uD50C\uB79C \uBD84\uD3EC"
  }, /*#__PURE__*/React.createElement(DonutChart, {
    size: 150,
    centerValue: "24",
    centerLabel: "\uC870\uC9C1",
    segments: [{
      label: 'Enterprise',
      value: 11,
      accent: true
    }, {
      label: 'Team',
      value: 9
    }, {
      label: 'Trial',
      value: 4
    }]
  }))), /*#__PURE__*/React.createElement(Card, {
    title: "\uC6D4\uAC04 \uD65C\uC131 \uC0AC\uC6A9\uC790 \uCD94\uC774",
    action: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)'
      }
    }, "ink: \uC804\uCCB4 \xB7 ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--accent)',
        fontWeight: 600
      }
    }, "indigo: Enterprise \uD50C\uB79C"))
  }, /*#__PURE__*/React.createElement(LineChart, {
    height: 170,
    series: [{
      values: [3200, 3350, 3410, 3600, 3720, 3980, 4310, 4820]
    }, {
      values: [1400, 1520, 1690, 1810, 2050, 2240, 2480, 2710],
      accent: true
    }],
    labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월']
  })));
}
function OrgsView() {
  const [rows, setRows] = React.useState([{
    id: 1,
    org: '테크코프 아카데미',
    plan: 'ENTERPRISE',
    seats: '142/200',
    status: 'ACTIVE',
    renewal: '2026-11-01'
  }, {
    id: 2,
    org: '한빛 부트캠프',
    plan: 'TEAM',
    seats: '48/50',
    status: 'ACTIVE',
    renewal: '2026-09-14'
  }, {
    id: 3,
    org: '서울코딩스쿨',
    plan: 'ENTERPRISE',
    seats: '310/400',
    status: 'ACTIVE',
    renewal: '2027-01-20'
  }, {
    id: 4,
    org: 'DevOps Lab',
    plan: 'TRIAL',
    seats: '12/25',
    status: 'ACTIVE',
    renewal: '2026-08-02'
  }, {
    id: 5,
    org: '그린 아카데미',
    plan: 'TEAM',
    seats: '0/30',
    status: 'INACTIVE',
    renewal: '—'
  }]);
  const [modal, setModal] = React.useState(false);
  const [name, setName] = React.useState('');
  const planMap = {
    ENTERPRISE: 'ink',
    TEAM: 'neutral',
    TRIAL: 'warning'
  };
  const cols = [{
    key: 'org',
    label: '조직명',
    sortable: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        color: 'var(--ink)'
      }
    }, r.org)
  }, {
    key: 'plan',
    label: '플랜',
    sortable: true,
    render: r => /*#__PURE__*/React.createElement(Badge, {
      status: planMap[r.plan]
    }, r.plan)
  }, {
    key: 'seats',
    label: '좌석 사용',
    render: r => /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 13
      }
    }, r.seats)
  }, {
    key: 'status',
    label: '상태',
    sortable: true,
    render: r => /*#__PURE__*/React.createElement(Badge, {
      status: r.status === 'ACTIVE' ? 'accent' : 'neutral'
    }, r.status)
  }, {
    key: 'renewal',
    label: '갱신일',
    sortable: true,
    align: 'right'
  }, {
    key: '_a',
    label: '',
    align: 'right',
    width: 44,
    render: () => /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontWeight: 700,
        letterSpacing: 1
      }
    }, "\u22EF")
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\uC870\uC9C1 \uAC80\uC0C9\u2026",
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "search",
      size: 15
    }),
    width: 220
  }), /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    value: "\uC804\uCCB4 \uC0C1\uD0DC",
    options: ['전체 상태', 'ACTIVE', 'INACTIVE']
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "plus",
      size: 14
    }),
    onClick: () => setModal(true)
  }, "\uC870\uC9C1 \uCD94\uAC00")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(DataTable, {
    columns: cols,
    rows: rows
  })), modal && /*#__PURE__*/React.createElement(Modal, {
    title: "\uC870\uC9C1 \uCD94\uAC00",
    description: "\uC0C8 \uC870\uC9C1\uC744 \uB4F1\uB85D\uD558\uACE0 \uAD00\uB9AC\uC790\uB97C \uCD08\uB300\uD569\uB2C8\uB2E4.",
    primaryLabel: "\uCD94\uAC00",
    secondaryLabel: "\uCDE8\uC18C",
    onPrimary: () => {
      if (name) {
        setRows(rs => [...rs, {
          id: Date.now(),
          org: name,
          plan: 'TRIAL',
          seats: '0/25',
          status: 'ACTIVE',
          renewal: '—'
        }]);
        setName('');
      }
      setModal(false);
    },
    onSecondary: () => setModal(false),
    onClose: () => setModal(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\uC870\uC9C1 \uC774\uB984",
    value: name,
    onChange: e => setName(e.target.value),
    width: "100%"
  }), /*#__PURE__*/React.createElement(Select, {
    value: "TRIAL",
    options: ['ENTERPRISE', 'TEAM', 'TRIAL'],
    style: {
      alignSelf: 'flex-start'
    }
  }))));
}
const TITLES = {
  overview: '플랫폼 현황',
  orgs: '조직'
};
function App() {
  const [view, setView] = React.useState('overview');
  const items = [{
    key: 'overview',
    label: '플랫폼 현황',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "layout-dashboard"
    })
  }, {
    key: 'orgs',
    label: '조직',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "building-2"
    }),
    badge: 24
  }, {
    key: 'monitor',
    label: '세션 모니터링',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "activity"
    })
  }, {
    key: 'audit',
    label: '감사 로그',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "scroll-text"
    })
  }, {
    key: 'settings',
    label: '설정',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "settings"
    })
  }];
  const sel = k => setView(TITLES[k] ? k : view);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-app)'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    items: items,
    activeKey: view,
    onSelect: sel,
    logoSrc: "../../assets/logo-cropped.png"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Topbar, {
    breadcrumbs: ['Qurie 운영', TITLES[view]],
    userName: "\uC774\uC11C\uC5F0",
    userRole: "OPERATOR",
    searchIcon: /*#__PURE__*/React.createElement(LIcon, {
      name: "search",
      size: 15
    }),
    actions: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)',
        display: 'flex',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(LIcon, {
      name: "bell",
      size: 17
    }))
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 22,
      fontWeight: 700
    }
  }, TITLES[view]), view === 'overview' && /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "download",
      size: 14
    })
  }, "\uB9AC\uD3EC\uD2B8 \uB0B4\uBCF4\uB0B4\uAE30")), view === 'overview' && /*#__PURE__*/React.createElement(OverviewView, null), view === 'orgs' && /*#__PURE__*/React.createElement(OrgsView, null))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminApp.jsx", error: String((e && e.message) || e) }); }

// ui_kits/enterprise/EnterpriseApp.jsx
try { (() => {
const NS = window.QurieDesignSystem_1efd37;
const {
  Button,
  Badge,
  Input,
  Select,
  StatCard,
  DataTable,
  BarChart,
  DonutChart,
  Modal,
  Sidebar,
  Topbar
} = NS;
function LIcon({
  name,
  size = 16
}) {
  return React.createElement('i', {
    ref: el => {
      if (el && !el.dataset.done) {
        el.dataset.done = 1;
        lucide.createIcons({
          attrs: {
            width: size,
            height: size,
            'stroke-width': 1.75
          }
        });
      }
    },
    'data-lucide': name,
    style: {
      display: 'inline-flex',
      width: size,
      height: size
    }
  });
}
function Card({
  title,
  action,
  children,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--shadow-card)',
      backdropFilter: 'var(--surface-blur)',
      WebkitBackdropFilter: 'var(--surface-blur)',
      padding: 'var(--card-padding)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      ...style
    }
  }, (title || action) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, title), action), children);
}
function DashView() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "armchair"
    }),
    value: "142",
    label: "\uC0AC\uC6A9 \uC911 \uC88C\uC11D / 200",
    delta: "+6",
    deltaDirection: "up",
    caption: "\uC774\uBC88 \uB2EC"
  }), /*#__PURE__*/React.createElement(StatCard, {
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "book-open"
    }),
    value: "12",
    label: "\uD65C\uC131 \uD074\uB798\uC2A4",
    delta: "+1",
    deltaDirection: "up",
    caption: "\uC774\uBC88 \uBD84\uAE30"
  }), /*#__PURE__*/React.createElement(StatCard, {
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "mail"
    }),
    value: "8",
    label: "\uB300\uAE30 \uC911 \uCD08\uB300",
    delta: "-3",
    deltaDirection: "down",
    caption: "\uC9C0\uB09C \uC8FC \uB300\uBE44"
  }), /*#__PURE__*/React.createElement(StatCard, {
    accent: true,
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "brain"
    }),
    value: "84%",
    label: "\uD034\uC988 \uD3C9\uADE0 \uC815\uB2F5\uB960",
    delta: "+2.1%",
    deltaDirection: "up",
    caption: "\uC804\uCCB4 \uD074\uB798\uC2A4"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1.4fr',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "\uC88C\uC11D \uC0AC\uC6A9"
  }, /*#__PURE__*/React.createElement(DonutChart, {
    size: 150,
    centerValue: "71%",
    centerLabel: "\uC0AC\uC6A9\uB960",
    segments: [{
      label: '사용 중',
      value: 142,
      accent: true
    }, {
      label: '미사용',
      value: 58
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    title: "\uD074\uB798\uC2A4\uBCC4 \uC8FC\uAC04 \uD65C\uB3D9",
    action: /*#__PURE__*/React.createElement(Select, {
      size: "sm",
      value: "\uCD5C\uADFC 7\uC77C",
      options: ['최근 7일', '최근 30일']
    })
  }, /*#__PURE__*/React.createElement(BarChart, {
    height: 180,
    showValues: true,
    data: [{
      label: '알고리즘',
      value: 61,
      highlight: true
    }, {
      label: '자료구조',
      value: 44
    }, {
      label: '시스템',
      value: 38
    }, {
      label: '웹 기초',
      value: 29
    }, {
      label: 'DevOps',
      value: 17
    }]
  }))));
}
const ROLE_OPTS = ['ADMIN', 'TEMP_ADMIN', 'STUDENT'];
function RoleCell({
  row,
  onChange
}) {
  return /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    value: row.role,
    options: ROLE_OPTS,
    onChange: v => onChange(row.id, v)
  });
}
function MembersView() {
  const [rows, setRows] = React.useState([{
    id: 1,
    name: '김지원',
    email: 'jiwon@corp.com',
    role: 'ADMIN',
    status: 'ACCEPTED',
    joined: '2026-05-02'
  }, {
    id: 2,
    name: '박민수',
    email: 'minsu@corp.com',
    role: 'STUDENT',
    status: 'ACCEPTED',
    joined: '2026-05-11'
  }, {
    id: 3,
    name: 'Lee Hana',
    email: 'hana@corp.com',
    role: 'TEMP_ADMIN',
    status: 'PENDING',
    joined: '—'
  }, {
    id: 4,
    name: '정우성',
    email: 'wsung@corp.com',
    role: 'STUDENT',
    status: 'PENDING',
    joined: '—'
  }, {
    id: 5,
    name: 'Choi Min',
    email: 'mchoi@corp.com',
    role: 'STUDENT',
    status: 'EXPIRED',
    joined: '—'
  }]);
  const [modal, setModal] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const setRole = (id, role) => setRows(rs => rs.map(r => r.id === id ? {
    ...r,
    role
  } : r));
  const statusMap = {
    ACCEPTED: 'success',
    PENDING: 'warning',
    EXPIRED: 'error'
  };
  const cols = [{
    key: 'name',
    label: '이름',
    sortable: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        color: 'var(--ink)'
      }
    }, r.name)
  }, {
    key: 'email',
    label: '이메일',
    render: r => /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 13
      }
    }, r.email)
  }, {
    key: 'role',
    label: '역할',
    render: r => /*#__PURE__*/React.createElement(RoleCell, {
      row: r,
      onChange: setRole
    })
  }, {
    key: 'status',
    label: '초대 상태',
    sortable: true,
    render: r => /*#__PURE__*/React.createElement(Badge, {
      status: statusMap[r.status]
    }, r.status)
  }, {
    key: 'joined',
    label: '가입일',
    sortable: true,
    align: 'right'
  }, {
    key: '_a',
    label: '',
    align: 'right',
    width: 44,
    render: () => /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontWeight: 700,
        letterSpacing: 1
      }
    }, "\u22EF")
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\uBA64\uBC84 \uAC80\uC0C9\u2026",
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "search",
      size: 15
    }),
    width: 220
  }), /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    value: "\uC804\uCCB4 \uC0C1\uD0DC",
    options: ['전체 상태', 'PENDING', 'ACCEPTED', 'EXPIRED']
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "send",
      size: 14
    }),
    onClick: () => setModal(true)
  }, "\uCD08\uB300 \uBCF4\uB0B4\uAE30")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(DataTable, {
    columns: cols,
    rows: rows
  })), modal && /*#__PURE__*/React.createElement(Modal, {
    title: "\uCD08\uB300 \uBCF4\uB0B4\uAE30",
    description: "\uC774\uBA54\uC77C \uC8FC\uC18C\uB85C \uC218\uAC15\uC0DD\uC744 \uCD08\uB300\uD569\uB2C8\uB2E4. \uCD08\uB300\uB294 7\uC77C \uD6C4 EXPIRED \uC0C1\uD0DC\uAC00 \uB429\uB2C8\uB2E4.",
    primaryLabel: "\uBCF4\uB0B4\uAE30",
    secondaryLabel: "\uCDE8\uC18C",
    onPrimary: () => {
      if (email) {
        setRows(rs => [...rs, {
          id: Date.now(),
          name: email.split('@')[0],
          email,
          role: 'STUDENT',
          status: 'PENDING',
          joined: '—'
        }]);
        setEmail('');
      }
      setModal(false);
    },
    onSecondary: () => setModal(false),
    onClose: () => setModal(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "email@company.com",
    value: email,
    onChange: e => setEmail(e.target.value),
    width: "100%"
  }), /*#__PURE__*/React.createElement(Select, {
    value: "STUDENT",
    options: ROLE_OPTS,
    style: {
      alignSelf: 'flex-start'
    }
  }))));
}
function ClassesView() {
  const rows = [{
    id: 1,
    name: '알고리즘 스터디',
    teacher: '김지원',
    students: 32,
    status: 'ACTIVE',
    created: '2026-03-02'
  }, {
    id: 2,
    name: '자료구조 심화',
    teacher: 'Lee Hana',
    students: 28,
    status: 'ACTIVE',
    created: '2026-04-15'
  }, {
    id: 3,
    name: '시스템 설계',
    teacher: '김지원',
    students: 24,
    status: 'ACTIVE',
    created: '2026-05-01'
  }, {
    id: 4,
    name: '웹 기초',
    teacher: '정우성',
    students: 41,
    status: 'INACTIVE',
    created: '2025-11-20'
  }];
  const cols = [{
    key: 'name',
    label: '클래스명',
    sortable: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        color: 'var(--ink)'
      }
    }, r.name)
  }, {
    key: 'teacher',
    label: '담당 강사'
  }, {
    key: 'students',
    label: '학생 수',
    sortable: true,
    align: 'right',
    render: r => /*#__PURE__*/React.createElement("span", {
      style: {
        fontVariantNumeric: 'tabular-nums'
      }
    }, r.students)
  }, {
    key: 'status',
    label: '상태',
    sortable: true,
    render: r => /*#__PURE__*/React.createElement(Badge, {
      status: r.status === 'ACTIVE' ? 'accent' : 'neutral'
    }, r.status)
  }, {
    key: 'created',
    label: '생성일',
    sortable: true,
    align: 'right'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\uD074\uB798\uC2A4 \uAC80\uC0C9\u2026",
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "search",
      size: 15
    }),
    width: 220
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "plus",
      size: 14
    })
  }, "\uD074\uB798\uC2A4 \uB9CC\uB4E4\uAE30")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(DataTable, {
    columns: cols,
    rows: rows
  })));
}
const TITLES = {
  dash: '대시보드',
  members: '멤버',
  classes: '클래스'
};
function App() {
  const [view, setView] = React.useState('dash');
  const items = [{
    key: 'dash',
    label: '대시보드',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "layout-dashboard"
    })
  }, {
    key: 'members',
    label: '멤버',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "users"
    }),
    badge: 8
  }, {
    key: 'classes',
    label: '클래스',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "book-open"
    })
  }, {
    key: 'reports',
    label: '리포트',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "file-bar-chart"
    })
  }, {
    key: 'settings',
    label: '설정',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "settings"
    })
  }];
  const sel = k => setView(TITLES[k] ? k : view);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-app)'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    items: items,
    activeKey: view,
    onSelect: sel,
    logoSrc: "../../assets/logo-cropped.png"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Topbar, {
    breadcrumbs: ['테크코프 아카데미', TITLES[view]],
    userName: "\uAE40\uC9C0\uC6D0",
    userRole: "ADMIN",
    searchIcon: /*#__PURE__*/React.createElement(LIcon, {
      name: "search",
      size: 15
    }),
    actions: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)',
        display: 'flex',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(LIcon, {
      name: "bell",
      size: 17
    }))
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 22,
      fontWeight: 700
    }
  }, TITLES[view]), view === 'dash' && /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "download",
      size: 14
    })
  }, "\uB9AC\uD3EC\uD2B8 \uB0B4\uBCF4\uB0B4\uAE30")), view === 'dash' && /*#__PURE__*/React.createElement(DashView, null), view === 'members' && /*#__PURE__*/React.createElement(MembersView, null), view === 'classes' && /*#__PURE__*/React.createElement(ClassesView, null))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/enterprise/EnterpriseApp.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workspace/WorkspaceApp.jsx
try { (() => {
const NS = window.QurieDesignSystem_1efd37;
const {
  Button,
  Badge,
  Input,
  Select,
  DataTable,
  DonutChart,
  EmptyState,
  Timer,
  Sidebar,
  Topbar,
  Chevron
} = NS;
function LIcon({
  name,
  size = 16
}) {
  return React.createElement('i', {
    ref: el => {
      if (el && !el.dataset.done) {
        el.dataset.done = 1;
        lucide.createIcons({
          attrs: {
            width: size,
            height: size,
            'stroke-width': 1.75
          }
        });
      }
    },
    'data-lucide': name,
    style: {
      display: 'inline-flex',
      width: size,
      height: size
    }
  });
}
function Card({
  title,
  action,
  children,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--shadow-card)',
      backdropFilter: 'var(--surface-blur)',
      WebkitBackdropFilter: 'var(--surface-blur)',
      padding: 'var(--card-padding)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      ...style
    }
  }, (title || action) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, title), action), children);
}
function SessionsView({
  onJoin
}) {
  const rows = [{
    id: 1,
    name: '주간 코드 리뷰 #12',
    cls: '알고리즘 스터디',
    members: 8,
    status: 'ACTIVE',
    start: '진행 중'
  }, {
    id: 2,
    name: 'PR 리뷰: auth 모듈',
    cls: '시스템 설계',
    members: 5,
    status: 'ACTIVE',
    start: '진행 중'
  }, {
    id: 3,
    name: '주간 코드 리뷰 #11',
    cls: '알고리즘 스터디',
    members: 9,
    status: 'ENDED',
    start: '07-16 20:00'
  }, {
    id: 4,
    name: '퀴즈 세션: 트리 순회',
    cls: '자료구조 심화',
    members: 24,
    status: 'ENDED',
    start: '07-15 19:00'
  }];
  const cols = [{
    key: 'name',
    label: '세션명',
    sortable: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        color: 'var(--ink)'
      }
    }, r.name)
  }, {
    key: 'cls',
    label: '클래스'
  }, {
    key: 'members',
    label: '참가자',
    align: 'right',
    sortable: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      style: {
        fontVariantNumeric: 'tabular-nums'
      }
    }, r.members)
  }, {
    key: 'status',
    label: '상태',
    sortable: true,
    render: r => /*#__PURE__*/React.createElement(Badge, {
      status: r.status === 'ACTIVE' ? 'accent' : 'neutral'
    }, r.status)
  }, {
    key: 'start',
    label: '시작',
    align: 'right'
  }, {
    key: '_j',
    label: '',
    align: 'right',
    width: 100,
    render: r => r.status === 'ACTIVE' ? /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "primary",
      onClick: onJoin
    }, "\uCC38\uC5EC ", /*#__PURE__*/React.createElement(Chevron, {
      color: "var(--primary-300)",
      size: 11
    })) : /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost"
    }, "\uAE30\uB85D \uBCF4\uAE30")
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\uC138\uC158 \uAC80\uC0C9\u2026",
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "search",
      size: 15
    }),
    width: 220
  }), /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    value: "\uC804\uCCB4 \uC0C1\uD0DC",
    options: ['전체 상태', 'ACTIVE', 'ENDED']
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "plus",
      size: 14
    })
  }, "\uC138\uC158 \uB9CC\uB4E4\uAE30")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(DataTable, {
    columns: cols,
    rows: rows
  })), /*#__PURE__*/React.createElement(Card, {
    title: "\uC608\uC815\uB41C \uD034\uC988",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(EmptyState, {
    message: "\uC608\uC815\uB41C \uD034\uC988\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    description: "\uB2F4\uB2F9 \uAC15\uC0AC\uAC00 \uD034\uC988\uB97C \uBC30\uC815\uD558\uBA74 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
  })));
}
const CODE = `function merge(local, remote) {
  // CRDT: last-writer-wins per field
  if (local.ts === remote.ts) {
    return local.actor < remote.actor ? local : remote;
  }
  return local.ts > remote.ts ? local : remote;
}`;
function RoomView() {
  const [comments, setComments] = React.useState([{
    id: 1,
    who: '김지원',
    role: 'ADMIN',
    text: 'ts 동률일 때 actor 비교로 결정성 확보한 부분 좋습니다.',
    line: 'L3'
  }, {
    id: 2,
    who: '박민수',
    role: 'STUDENT',
    text: 'actor 비교가 사전순인데, 의도된 규칙인가요?',
    line: 'L4'
  }]);
  const [draft, setDraft] = React.useState('');
  const files = ['crdt/merge.js', 'crdt/clock.js', 'room/session.ts', 'quiz/score.ts'];
  const [file, setFile] = React.useState(files[0]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '180px 1.6fr 1fr',
      gap: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "\uD30C\uC77C",
    style: {
      padding: 16,
      gap: 4
    }
  }, files.map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    onClick: () => setFile(f),
    style: {
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      padding: '6px 10px',
      borderRadius: 'var(--radius-pill)',
      background: f === file ? 'var(--accent-softer)' : 'transparent',
      color: f === file ? 'var(--accent)' : 'var(--text-secondary)',
      fontWeight: f === file ? 600 : 400
    }
  }, f))), /*#__PURE__*/React.createElement(Card, {
    title: file,
    action: /*#__PURE__*/React.createElement(Badge, {
      status: "accent"
    }, "LIVE \xB7 5")
  }, /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      background: 'var(--surface-sunken)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      fontSize: 13,
      lineHeight: 1.7,
      overflow: 'auto'
    }
  }, CODE), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, "commit a3f92c1"), /*#__PURE__*/React.createElement(Chevron, {
    size: 10,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("span", null, "\uBC15\uBBFC\uC218 \xB7 12\uBD84 \uC804"))), /*#__PURE__*/React.createElement(Card, {
    title: "\uB9AC\uBDF0 \uCF54\uBA58\uD2B8"
  }, comments.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      borderBottom: '1px solid var(--divider)',
      paddingBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: 'var(--accent-soft)',
      color: 'var(--accent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 700
    }
  }, c.who.slice(0, 1)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, c.who), /*#__PURE__*/React.createElement(Badge, {
    status: c.role === 'ADMIN' ? 'ink' : 'neutral'
  }, c.role), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, c.line)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      lineHeight: 1.55
    }
  }, c.text))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\uCF54\uBA58\uD2B8 \uC791\uC131\u2026",
    value: draft,
    onChange: e => setDraft(e.target.value),
    width: "100%",
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: () => {
      if (draft) {
        setComments(cs => [...cs, {
          id: Date.now(),
          who: '박민수',
          role: 'STUDENT',
          text: draft,
          line: '—'
        }]);
        setDraft('');
      }
    }
  }, "\uB4F1\uB85D"))));
}
function QuizView() {
  const [remaining, setRemaining] = React.useState(64);
  React.useEffect(() => {
    const t = setInterval(() => setRemaining(r => r > 0 ? r - 1 : 90), 1000);
    return () => clearInterval(t);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr',
      gap: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "\uBB38\uC81C 3 / 10",
    action: /*#__PURE__*/React.createElement(Timer, {
      variant: "bar",
      totalSeconds: 90,
      remainingSeconds: remaining,
      style: {
        width: 200
      }
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 600,
      color: 'var(--ink)',
      lineHeight: 1.5
    }
  }, "\uB2E4\uC74C \uCF54\uB4DC\uC5D0\uC11C CRDT \uBCD1\uD569 \uC2DC \uBC1C\uC0DD\uD560 \uC218 \uC788\uB294 \uBB38\uC81C\uB294 \uBB34\uC5C7\uC778\uAC00\uC694?"), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      background: 'var(--surface-sunken)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      fontSize: 13,
      lineHeight: 1.6,
      overflow: 'auto'
    }
  }, `function merge(local, remote) {
  return local.ts > remote.ts ? local : remote;
}`), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, ['동시 편집 시 한쪽 변경이 유실된다', '타임스탬프 충돌 시 결정적이지 않다', '병합 결과가 커밋되지 않는다'].map((o, i) => /*#__PURE__*/React.createElement("label", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      border: `1px solid ${i === 1 ? 'var(--accent)' : 'var(--border-strong)'}`,
      background: i === 1 ? 'var(--accent-softer)' : 'var(--surface-card)',
      borderRadius: 'var(--radius-md)',
      padding: '11px 14px',
      fontSize: 14,
      cursor: 'pointer',
      color: 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      borderRadius: '50%',
      border: `1.5px solid ${i === 1 ? 'var(--accent)' : 'var(--grey-200)'}`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, i === 1 && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--accent)'
    }
  })), o))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "\uB2E4\uC74C \uBB38\uC81C ", /*#__PURE__*/React.createElement(Chevron, {
    color: "var(--primary-300)",
    size: 13
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "\uC138\uC158 \uD0C0\uC774\uBA38",
    style: {
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Timer, {
    totalSeconds: 90,
    remainingSeconds: remaining,
    size: 92,
    label: "\uB0A8\uC740 \uC2DC\uAC04"
  })), /*#__PURE__*/React.createElement(Card, {
    title: "\uC9C0\uB09C \uC138\uC158 \uACB0\uACFC"
  }, /*#__PURE__*/React.createElement(DonutChart, {
    size: 110,
    thickness: 14,
    centerValue: "8/10",
    centerLabel: "\uC815\uB2F5",
    segments: [{
      label: '정답',
      value: 8,
      accent: true
    }, {
      label: '오답',
      value: 2
    }]
  }))));
}
const TITLES = {
  sessions: '세션',
  room: '리뷰 Room',
  quiz: 'AI 퀴즈'
};
function App() {
  const [view, setView] = React.useState('sessions');
  const items = [{
    key: 'sessions',
    label: '세션',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "radio"
    }),
    badge: 2
  }, {
    key: 'room',
    label: '리뷰 Room',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "code"
    })
  }, {
    key: 'quiz',
    label: 'AI 퀴즈',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "brain"
    })
  }, {
    key: 'learning',
    label: '내 학습',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "graduation-cap"
    })
  }, {
    key: 'settings',
    label: '설정',
    icon: /*#__PURE__*/React.createElement(LIcon, {
      name: "settings"
    })
  }];
  const sel = k => setView(TITLES[k] ? k : view);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-app)'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    items: items,
    activeKey: view,
    onSelect: sel,
    logoSrc: "../../assets/logo-cropped.png"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Topbar, {
    breadcrumbs: ['알고리즘 스터디', TITLES[view]],
    userName: "\uBC15\uBBFC\uC218",
    userRole: "STUDENT",
    searchIcon: /*#__PURE__*/React.createElement(LIcon, {
      name: "search",
      size: 15
    }),
    actions: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)',
        display: 'flex',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(LIcon, {
      name: "bell",
      size: 17
    }))
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 22,
      fontWeight: 700
    }
  }, TITLES[view])), view === 'sessions' && /*#__PURE__*/React.createElement(SessionsView, {
    onJoin: () => setView('room')
  }), view === 'room' && /*#__PURE__*/React.createElement(RoomView, null), view === 'quiz' && /*#__PURE__*/React.createElement(QuizView, null))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/WorkspaceApp.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.DonutChart = __ds_scope.DonutChart;

__ds_ns.LineChart = __ds_scope.LineChart;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.StatCardRow = __ds_scope.StatCardRow;

__ds_ns.ChartLegend = __ds_scope.ChartLegend;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Timer = __ds_scope.Timer;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Chevron = __ds_scope.Chevron;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.Topbar = __ds_scope.Topbar;

__ds_ns.Modal = __ds_scope.Modal;

})();
