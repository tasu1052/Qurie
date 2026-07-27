import React from 'react';
/** KPI stat card. The delta sits immediately right of the value: green ↑ for a numeric
 * increase, red ↓ for a decrease — no other delta treatment exists. Non-numeric status
 * text (LIVE, PENDING…) belongs in `caption`, never in `delta`. */
export function StatCard({icon=null,label,value,delta=null,deltaDirection=null,caption=null,accent=false,style={}}){
const dir=delta==null?null:(deltaDirection==='up'||deltaDirection==='down')?deltaDirection:String(delta).trim().startsWith('-')?'down':'up';
return <div style={{background:'var(--surface-card)',border:'1px solid var(--border)',borderRadius:'var(--card-radius)',boxShadow:'var(--shadow-card)',backdropFilter:'var(--surface-blur)',WebkitBackdropFilter:'var(--surface-blur)',padding:'var(--stat-card-padding)',display:'flex',flexDirection:'column',gap:12,minWidth:0,fontFamily:'var(--font-sans)',...style}}>
{icon&&<span style={{width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'var(--radius-md)',background:accent?'var(--accent-soft)':'var(--surface-sunken)',color:accent?'var(--accent)':'var(--text-secondary)'}}>{icon}</span>}
<div style={{display:'flex',flexDirection:'column',gap:4}}>
<div style={{display:'flex',alignItems:'baseline',gap:8,minWidth:0}}>
<span style={{fontSize:'var(--text-kpi)',fontWeight:700,color:accent?'var(--accent)':'var(--ink)',letterSpacing:'-0.02em',lineHeight:1.1,fontVariantNumeric:'tabular-nums'}}>{value}</span>
{dir&&<span style={{fontSize:13,fontWeight:600,color:dir==='up'?'var(--status-success)':'var(--status-error)',whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums'}}>{dir==='up'?'↑':'↓'}{'\u2009'}{delta}</span>}
</div>
<span style={{fontSize:12,color:'var(--text-secondary)',fontWeight:500}}>{label}</span>
{caption&&<span style={{fontSize:11,color:'var(--text-muted)'}}>{caption}</span>}
</div>
</div>;
}
