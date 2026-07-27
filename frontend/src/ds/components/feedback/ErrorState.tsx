import React from 'react';
export function ErrorState({title,description=null,icon=null,code=null,actionLabel='다시 시도',onRetry,secondaryLabel=null,onSecondary,style={}}){
return <div role="alert" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:'40px 32px',textAlign:'center',fontFamily:'var(--font-sans)',...style}}>
{icon&&<span style={{width:44,height:44,borderRadius:'50%',background:'var(--status-error-bg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--status-error)'}}>{icon}</span>}
<span style={{fontSize:17,fontWeight:600,color:'var(--ink)'}}>{title}</span>
{description&&<span style={{fontSize:13,color:'var(--text-secondary)',maxWidth:360,lineHeight:1.55,textWrap:'pretty'}}>{description}</span>}
{code&&<span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)',background:'var(--surface-sunken)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',padding:'8px 12px'}}>{code}</span>}
<div style={{display:'flex',gap:10,marginTop:4}}>
{actionLabel&&<button onClick={onRetry} style={{height:36,padding:'0 18px',borderRadius:'var(--radius-control)',border:'none',background:'var(--ink)',color:'var(--text-inverse)',fontFamily:'var(--font-sans)',fontSize:13,fontWeight:600,cursor:'pointer'}}>{actionLabel}</button>}
{secondaryLabel&&<button onClick={onSecondary} style={{height:36,padding:'0 18px',borderRadius:'var(--radius-control)',border:'1px solid var(--border-strong)',background:'var(--surface-card)',color:'var(--ink)',fontFamily:'var(--font-sans)',fontSize:13,cursor:'pointer'}}>{secondaryLabel}</button>}
</div>
</div>;
}
