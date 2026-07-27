import React from 'react';
/** Line chart (SVG). series: [{name,values:number[],accent?}] — ink primary, indigo accent series. */
export function LineChart({series=[],labels=[],height=180,width='100%',showDots=true,style={}}){
const W=600,H=200,PX=8,PY=16;
const all=series.flatMap(s=>s.values);const max=Math.max(...all,1),min=Math.min(...all,0);
const x=i=>PX+i*((W-2*PX)/Math.max((labels.length||series[0]?.values.length||2)-1,1));
const y=v=>H-PY-((v-min)/(max-min||1))*(H-2*PY);
const path=vals=>vals.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
return <div style={{fontFamily:'var(--font-sans)',...style}}>
<svg viewBox={`0 0 ${W} ${H}`} style={{width,height,display:'block'}} preserveAspectRatio="none">
{[0.25,0.5,0.75].map(t=><line key={t} x1={PX} x2={W-PX} y1={PY+t*(H-2*PY)} y2={PY+t*(H-2*PY)} stroke="var(--chart-grid)" strokeWidth="1"/>)}
{series.map((s,si)=><g key={si}>
<path d={path(s.values)} fill="none" stroke={s.accent?'var(--chart-accent)':'var(--chart-primary)'} strokeWidth={s.accent?2.5:2} strokeLinejoin="round" strokeLinecap="round"/>
{showDots&&s.values.map((v,i)=><circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.accent?'var(--chart-accent)':'var(--chart-primary)'} stroke="var(--surface-card)" strokeWidth="1.5"/>)}
</g>)}
</svg>
{labels.length>0&&<div style={{display:'flex',justifyContent:'space-between',padding:`4px ${PX}px 0`,fontSize:11,color:'var(--text-muted)'}}>{labels.map((l,i)=><span key={i}>{l}</span>)}</div>}
</div>;
}
