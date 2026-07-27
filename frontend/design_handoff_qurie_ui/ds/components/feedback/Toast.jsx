import React from 'react';
export function Toast({tone='neutral',message,icon=null,actionLabel=null,onAction,hint=null,style={}}){
return <div role="status" style={{display:'flex',alignItems:'center',gap:11,background:'var(--surface-ink)',borderRadius:'var(--radius-md)',padding:'12px 16px',boxShadow:'0 6px 20px rgba(17,17,17,0.14)',fontFamily:'var(--font-sans)',...style}}>
{icon&&<span style={{display:'flex',color:tone==='error'?'rgb(233,150,150)':'#fff'}}>{icon}</span>}
<span style={{fontSize:13,color:'#fff'}}>{message}</span>
{hint&&<span style={{marginLeft:'auto',fontFamily:'var(--font-mono)',fontSize:11,color:'rgba(255,255,255,0.6)'}}>{hint}</span>}
{actionLabel&&<button onClick={onAction} style={{marginLeft:hint?12:'auto',background:'none',border:'none',padding:0,fontFamily:'var(--font-sans)',fontSize:12,fontWeight:600,color:tone==='error'?'rgb(233,150,150)':'#fff',cursor:'pointer'}}>{actionLabel}</button>}
</div>;
}
export function ToastStack({children,style={}}){
return <div style={{position:'fixed',right:24,bottom:24,display:'flex',flexDirection:'column',gap:10,zIndex:60,...style}}>{children}</div>;
}
