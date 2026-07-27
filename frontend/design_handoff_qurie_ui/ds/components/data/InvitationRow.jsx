import React from 'react';
const S={PENDING:{fg:'var(--status-warning)',bg:'var(--status-warning-bg)'},EXPIRED:{fg:'var(--status-error)',bg:'var(--status-error-bg)'},ACCEPTED:{fg:'var(--status-success)',bg:'var(--status-success-bg)'}};
export function InvitationRow({email,meta,status='PENDING',cooldownSec=0,onResend,onCancel,trailing=null}){
const t=S[status]||S.PENDING;
const cooling=cooldownSec>0;
return <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px',borderTop:'1px solid var(--divider)',fontFamily:'var(--font-sans)'}}>
<div style={{display:'flex',flexDirection:'column',gap:2,minWidth:0}}>
<span style={{fontFamily:'var(--font-mono)',fontSize:12.5,color:'var(--ink)'}}>{email}</span>
<span style={{fontSize:11.5,color:'var(--text-muted)'}}>{meta}</span>
</div>
<span style={{marginLeft:'auto',background:t.bg,color:t.fg,borderRadius:'var(--radius-control)',padding:'3px 10px',fontSize:10.5,fontWeight:600,letterSpacing:'0.06em'}}>{status}</span>
{status==='ACCEPTED'?trailing:<>
<button onClick={onResend} disabled={cooling} style={{height:30,padding:'0 12px',borderRadius:'var(--radius-control)',border:status==='EXPIRED'?'none':'1px solid var(--border-strong)',background:status==='EXPIRED'?'var(--ink)':'#fff',color:cooling?'var(--text-muted)':(status==='EXPIRED'?'#fff':'var(--ink)'),fontFamily:'var(--font-sans)',fontSize:12,fontWeight:status==='EXPIRED'?600:400,cursor:cooling?'default':'pointer'}}>{cooling?cooldownSec+'초 후 재발송':'재발송'}</button>
<span onClick={onCancel} title="초대 취소" style={{color:'var(--text-muted)',cursor:'pointer'}}>✕</span>
</>}
</div>;
}
