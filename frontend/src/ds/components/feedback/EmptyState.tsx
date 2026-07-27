import React from 'react';
export function EmptyState({message,description=null,actionLabel=null,onAction,style={}}){
return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,padding:'48px 24px',textAlign:'center',fontFamily:'var(--font-sans)',...style}}>
<span style={{fontSize:15,fontWeight:600,color:'var(--ink)'}}>{message}</span>
{description&&<span style={{fontSize:13,color:'var(--text-secondary)',maxWidth:340,lineHeight:1.55}}>{description}</span>}
{actionLabel&&<button onClick={onAction} style={{marginTop:12,background:'var(--ink)',color:'var(--text-inverse)',border:'none',borderRadius:'var(--radius-control)',padding:'10px 18px',fontSize:14,fontWeight:600,fontFamily:'var(--font-sans)',cursor:'pointer'}}>{actionLabel}</button>}
</div>;
}
