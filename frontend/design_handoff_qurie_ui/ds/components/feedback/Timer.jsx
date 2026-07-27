import React from 'react';
/** Calm circular countdown for the AI quiz flow. Indigo sweep, no alarming colors. */
export function Timer({totalSeconds=60,remainingSeconds=null,running=false,size=64,variant='ring',label=null,onComplete,style={}}){
const [internal,setInternal]=React.useState(remainingSeconds??totalSeconds);
const remaining=remainingSeconds??internal;
React.useEffect(()=>{if(remainingSeconds!=null||!running)return;const t=setInterval(()=>setInternal(r=>{if(r<=1){clearInterval(t);onComplete&&onComplete();return 0}return r-1}),1000);return()=>clearInterval(t)},[running,remainingSeconds]);
const frac=Math.max(0,Math.min(1,remaining/totalSeconds));
const mm=Math.floor(remaining/60),ss=String(remaining%60).padStart(2,'0');
const text=remaining>=60?`${mm}:${ss}`:`${remaining}`;
if(variant==='bar')return <div style={{display:'flex',flexDirection:'column',gap:6,fontFamily:'var(--font-sans)',minWidth:160,...style}}>
<div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
<span style={{color:'var(--text-secondary)'}}>{label??'남은 시간'}</span>
<span style={{fontWeight:600,color:'var(--ink)',fontVariantNumeric:'tabular-nums'}}>{mm}:{ss}</span>
</div>
<div style={{height:6,borderRadius:3,background:'var(--chart-grid)',overflow:'hidden'}}>
<div style={{height:'100%',width:`${frac*100}%`,background:'var(--accent)',borderRadius:3,transition:'width 950ms linear'}}></div>
</div>
</div>;
const R=42,C=2*Math.PI*R;
return <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center',gap:6,fontFamily:'var(--font-sans)',...style}}>
<div style={{position:'relative',width:size,height:size}}>
<svg viewBox="0 0 100 100" style={{width:size,height:size,transform:'rotate(-90deg)'}}>
<circle cx="50" cy="50" r={R} fill="none" stroke="var(--chart-grid)" strokeWidth="8"/>
<circle cx="50" cy="50" r={R} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-frac)} style={{transition:'stroke-dashoffset 950ms linear'}}/>
</svg>
<span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.26,fontWeight:700,color:'var(--ink)',fontVariantNumeric:'tabular-nums'}}>{text}</span>
</div>
{label&&<span style={{fontSize:11,color:'var(--text-muted)'}}>{label}</span>}
</div>;
}
