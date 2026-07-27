import React from 'react';
import { Spinner } from './Spinner.jsx';
const S={
offline:{fg:'var(--status-error)',bg:'var(--status-error-bg)',bd:'rgba(178,70,70,0.22)',label:'오프라인'},
reconnecting:{fg:'var(--status-warning)',bg:'var(--status-warning-bg)',bd:'rgba(158,113,32,0.22)',label:'재연결 중'},
connected:{fg:'var(--status-success)',bg:'var(--status-success-bg)',bd:'rgba(52,124,88,0.22)',label:'연결됨'}};
export function ConnectionBar({status='connected',detail=null,icon=null,style={}}){
const s=S[status]||S.connected;
return <div role="status" style={{display:'flex',alignItems:'center',gap:10,background:s.bg,border:`1px solid ${s.bd}`,borderRadius:'var(--radius-md)',padding:'10px 14px',fontFamily:'var(--font-sans)',...style}}>
{status==='reconnecting'?<Spinner size="sm" tone="warning"/>:icon||<span style={{width:7,height:7,borderRadius:'50%',background:s.fg,flex:'none'}}/>}
<span style={{fontSize:13,fontWeight:600,color:s.fg}}>{s.label}</span>
{detail&&<span style={{fontSize:12,color:'var(--text-secondary)'}}>{detail}</span>}
</div>;
}
