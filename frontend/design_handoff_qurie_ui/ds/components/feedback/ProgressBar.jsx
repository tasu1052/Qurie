import React from 'react';
export function ProgressBar({value=null,label=null,hint=null,style={}}){
const indeterminate=value===null||value===undefined;
return <div style={{display:'flex',flexDirection:'column',gap:8,fontFamily:'var(--font-sans)',...style}}>
{(label||hint)&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-secondary)'}}><span>{label}</span><span style={{fontFamily:indeterminate?'var(--font-sans)':'var(--font-mono)',color:indeterminate?'var(--text-muted)':'var(--text-secondary)'}}>{hint??`${Math.round(value)}%`}</span></div>}
<div role="progressbar" aria-valuenow={indeterminate?undefined:value} style={{height:6,borderRadius:'var(--radius-control)',background:'var(--surface-sunken)',overflow:'hidden',position:'relative'}}>
<div style={indeterminate
?{position:'absolute',left:0,top:0,width:'32%',height:'100%',background:'var(--accent)',borderRadius:'var(--radius-control)',animation:'qurie-progress 1.5s ease-in-out infinite'}
:{width:`${Math.max(0,Math.min(100,value))}%`,height:'100%',background:'var(--accent)',borderRadius:'var(--radius-control)',transition:'width 180ms ease-out'}}/>
</div>
</div>;
}
