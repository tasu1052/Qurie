import React from 'react';
/** Donut/ring chart. segments: [{label,value,accent?}] — accent segment indigo, rest ink/grays. */
export function DonutChart({segments=[],size=140,thickness=16,centerValue=null,centerLabel=null,style={}}){
const total=segments.reduce((a,s)=>a+s.value,0)||1;
const R=(100-thickness)/2,C=2*Math.PI*R;
const palette=['var(--chart-primary)','var(--grey-400)','var(--grey-200)','var(--grey-100)'];
const segs=segments.reduce((acc,s,i)=>{
  const frac=s.value/total;
  const color=s.accent?'var(--chart-accent)':palette[i%palette.length];
  const offset=acc.length?acc[acc.length-1].offset+acc[acc.length-1].frac:0;
  return [...acc,{...s,frac,offset,color}];
},[]);
return <div style={{display:'inline-flex',alignItems:'center',gap:20,fontFamily:'var(--font-sans)',...style}}>
<div style={{position:'relative',width:size,height:size}}>
<svg viewBox="0 0 100 100" style={{width:size,height:size,transform:'rotate(-90deg)'}}>
<circle cx="50" cy="50" r={R} fill="none" stroke="var(--chart-grid)" strokeWidth={thickness}/>
{segs.map((s,i)=><circle key={i} cx="50" cy="50" r={R} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={`${Math.max(s.frac*C-1.5,0)} ${C}`} strokeDashoffset={-s.offset*C} strokeLinecap="butt"/>)}
</svg>
{(centerValue!=null)&&<div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
<span style={{fontSize:size*0.17,fontWeight:700,color:'var(--ink)',lineHeight:1.1,fontVariantNumeric:'tabular-nums'}}>{centerValue}</span>
{centerLabel&&<span style={{fontSize:size*0.075,color:'var(--text-muted)'}}>{centerLabel}</span>}
</div>}
</div>
<div style={{display:'flex',flexDirection:'column',gap:8,flexShrink:0}}>
{segs.map((s,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
<span style={{width:8,height:8,borderRadius:2,background:s.color,flexShrink:0}}></span>
<span style={{color:'var(--text-body)',whiteSpace:'nowrap'}}>{s.label}</span>
<span style={{color:'var(--text-muted)',fontVariantNumeric:'tabular-nums',marginLeft:'auto'}}>{Math.round(s.frac*100)}%</span>
</div>)}
</div>
</div>;
}
