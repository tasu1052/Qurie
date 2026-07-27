import React from 'react';
export function Button({variant='primary',size='md',disabled=false,icon=null,children,onClick,style={}}){
const base={fontFamily:'var(--font-sans)',fontWeight:600,borderRadius:'var(--radius-control)',cursor:disabled?'not-allowed':'pointer',display:'inline-flex',alignItems:'center',gap:8,border:'1px solid transparent',transition:'background 140ms ease-out,border-color 140ms ease-out',lineHeight:1,whiteSpace:'nowrap'};
const sizes={sm:{fontSize:13,padding:'7px 14px',minHeight:'var(--control-h-sm)'},md:{fontSize:14,padding:'10px 18px',minHeight:'var(--control-h-md)'}};
const variants={
primary:{background:'var(--ink)',color:'var(--text-inverse)'},
secondary:{background:'var(--surface-card)',color:'var(--ink)',borderColor:'var(--border-strong)'},
ghost:{background:'transparent',color:'var(--text-secondary)'},
accent:{background:'var(--accent)',color:'var(--text-inverse)'}};
const dis=disabled?{opacity:0.45,pointerEvents:'none'}:{};
const [hover,setHover]=React.useState(false);
const hov=hover&&!disabled?{primary:{background:'var(--grey-600)'},secondary:{background:'var(--surface-hover)'},ghost:{background:'var(--surface-hover)',color:'var(--ink)'},accent:{background:'var(--accent-strong)'}}[variant]:{};
return <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{...base,...sizes[size],...variants[variant],...hov,...dis,...style}}>{icon}{children}</button>;
}
