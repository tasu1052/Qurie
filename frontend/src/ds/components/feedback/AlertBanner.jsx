import React from 'react';
import {NOISE_TEXTURE,GLASS_BLUR} from '../texture.js';
const TONES={
error:{fg:'var(--status-error)',bg:'var(--status-error-bg)',bd:'rgba(178,70,70,0.22)'},
warning:{fg:'var(--status-warning)',bg:'var(--status-warning-bg)',bd:'rgba(158,113,32,0.22)'},
info:{fg:'var(--accent-strong)',bg:'var(--status-accent-bg)',bd:'rgba(99,102,241,0.22)'},
success:{fg:'var(--status-success)',bg:'var(--status-success-bg)',bd:'rgba(52,124,88,0.22)'}};
export function AlertBanner({tone='error',title,description=null,icon=null,actionLabel=null,onAction,style={}}){
const t=TONES[tone]||TONES.error;
return <div role={tone==='error'?'alert':'status'} style={{display:'flex',alignItems:'flex-start',gap:11,
backgroundColor:`color-mix(in srgb, ${t.bg} 68%, transparent)`,
backgroundImage:NOISE_TEXTURE,
backdropFilter:GLASS_BLUR,WebkitBackdropFilter:GLASS_BLUR,
border:`1px solid ${t.bd}`,
boxShadow:'inset 0 1px 0 color-mix(in srgb, var(--text-inverse) 45%, transparent)',
borderRadius:'var(--radius-md)',padding:'12px 14px',fontFamily:'var(--font-sans)',...style}}>
{icon&&<span style={{color:t.fg,display:'flex',marginTop:1}}>{icon}</span>}
<div style={{display:'flex',flexDirection:'column',gap:2}}>
<span style={{fontSize:13,fontWeight:600,color:t.fg}}>{title}</span>
{description&&<span style={{fontSize:12,color:'var(--text-secondary)',textWrap:'pretty'}}>{description}</span>}
</div>
{actionLabel&&<button onClick={onAction} style={{marginLeft:'auto',background:'none',border:'none',padding:0,fontFamily:'var(--font-sans)',fontSize:12,fontWeight:600,color:t.fg,cursor:'pointer'}}>{actionLabel}</button>}
</div>;
}
