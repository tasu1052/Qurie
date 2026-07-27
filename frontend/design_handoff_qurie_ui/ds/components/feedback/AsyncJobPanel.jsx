import React from 'react';
import { Spinner } from './Spinner.jsx';
import { ProgressBar } from './ProgressBar.jsx';
const TONE={PENDING:{fg:'var(--accent-strong)',bg:'var(--status-accent-bg)'},GENERATING:{fg:'var(--accent-strong)',bg:'var(--status-accent-bg)'},RUNNING:{fg:'var(--accent-strong)',bg:'var(--status-accent-bg)'},FAILED:{fg:'var(--status-error)',bg:'var(--status-error-bg)'},DONE:{fg:'var(--status-success)',bg:'var(--status-success-bg)'}};
/** 202-accepted job: status badge + progress + failure with the server's message. */
export function AsyncJobPanel({label,status='PENDING',title,description,done=null,total=null,errorMessage=null,meta=null,primaryLabel,onPrimary,secondaryLabel,onSecondary,children,style={}}){
const t=TONE[status]||TONE.PENDING;
const failed=status==='FAILED';
return <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:20,display:'flex',flexDirection:'column',gap:14,fontFamily:'var(--font-sans)',...style}}>
<div style={{display:'flex',alignItems:'center',gap:8}}>
<span style={{fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--accent)'}}>{label}</span>
<span style={{marginLeft:'auto',fontFamily:'var(--font-mono)',fontSize:10.5,background:t.bg,color:t.fg,borderRadius:'var(--radius-control)',padding:'2px 8px'}}>{status}</span>
</div>
{total!=null&&!failed&&<ProgressBar value={done!=null?Math.round((done/total)*100):null} label={title} hint={done!=null?done+' / '+total:undefined}/>}
{(total==null||failed)&&<div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,textAlign:'center',padding:'8px 0'}}>
{failed?<span style={{width:40,height:40,borderRadius:'50%',background:'var(--status-error-bg)',color:'var(--status-error)',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>!</span>:<Spinner size="lg"/>}
<span style={{fontSize:14,fontWeight:600,color:'var(--ink)'}}>{title}</span>
{description&&<span style={{fontSize:12.5,color:'var(--text-secondary)',textWrap:'pretty'}}>{description}</span>}
{failed&&errorMessage&&<span style={{fontFamily:'var(--font-mono)',fontSize:10.5,color:'var(--text-muted)',background:'var(--surface-sunken)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',padding:'7px 10px'}}>{errorMessage}</span>}
</div>}
{children}
{meta&&<span style={{fontFamily:'var(--font-mono)',fontSize:10.5,color:'var(--text-muted)'}}>{meta}</span>}
{(primaryLabel||secondaryLabel)&&<div style={{display:'flex',flexDirection:'column',gap:8,borderTop:'1px solid var(--divider)',paddingTop:12}}>
{primaryLabel&&<button onClick={onPrimary} style={{height:36,borderRadius:'var(--radius-control)',border:'none',background:'var(--ink)',color:'#fff',fontFamily:'var(--font-sans)',fontSize:13,fontWeight:600,cursor:'pointer'}}>{primaryLabel}</button>}
{secondaryLabel&&<button onClick={onSecondary} style={{height:36,borderRadius:'var(--radius-control)',border:'1px solid var(--border-strong)',background:'#fff',color:'var(--ink)',fontFamily:'var(--font-sans)',fontSize:13,cursor:'pointer'}}>{secondaryLabel}</button>}
</div>}
</div>;
}
