import React from 'react';
/**
 * Type-the-name confirmation for destructive actions. The primary button stays
 * disabled until `typed === confirmText`; `childCounts` shows what disappears
 * with the record, and `conflict` renders the server's 409 with the
 * ?cascade=true opt-in.
 */
export function ConfirmDeleteModal({title,description,confirmText,typed='',childCounts=[],conflict=false,cascade=false,onCascadeChange,onCancel,onConfirm,confirmLabel='삭제'}){
const matched=typed.trim()===confirmText;
const blocked=conflict&&!cascade;
return <div role="dialog" aria-modal="true" style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--radius-xl)',boxShadow:'0 12px 40px rgba(17,17,17,0.12)',padding:24,display:'flex',flexDirection:'column',gap:16,fontFamily:'var(--font-sans)',maxWidth:440}}>
<div style={{display:'flex',alignItems:'flex-start',gap:12}}>
<span style={{width:38,height:38,borderRadius:'50%',background:'var(--status-error-bg)',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--status-error)',fontSize:12,fontWeight:700}}>삭제</span>
<div style={{display:'flex',flexDirection:'column',gap:4}}>
<h3 style={{fontSize:17,fontWeight:700,color:'var(--ink)',margin:0}}>{title}</h3>
<span style={{fontSize:13,lineHeight:1.6,color:'var(--text-secondary)',textWrap:'pretty'}}>{description}</span>
</div>
</div>
{childCounts.length>0&&<div style={{display:'flex',flexDirection:'column',gap:8,background:'var(--status-warning-bg)',border:'1px solid rgba(158,113,32,0.22)',borderRadius:'var(--radius-md)',padding:'14px 16px'}}>
<span style={{fontSize:12.5,fontWeight:600,color:'var(--status-warning)'}}>함께 삭제되는 데이터</span>
<div style={{display:'flex',flexWrap:'wrap',gap:8}}>{childCounts.map((c,i)=><span key={i} style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--radius-control)',padding:'3px 10px',fontSize:11.5,color:'var(--text-body)'}}>{c}</span>)}</div>
</div>}
{conflict&&<label style={{display:'flex',alignItems:'flex-start',gap:9,fontSize:12.5,color:'var(--text-body)',background:'var(--surface-sunken)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',padding:'11px 13px',cursor:'pointer'}}>
<input type="checkbox" checked={cascade} onChange={e=>onCascadeChange&&onCascadeChange(e.target.checked)} style={{marginTop:2}}/>
<span>하위 데이터까지 함께 삭제합니다 <span style={{fontFamily:'var(--font-mono)',fontSize:11.5,color:'var(--text-muted)'}}>?cascade=true</span></span>
</label>}
<div style={{display:'flex',flexDirection:'column',gap:6}}>
<span style={{fontSize:12.5,color:'var(--text-secondary)'}}>확인을 위해 <span style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--ink)',background:'var(--surface-sunken)',border:'1px solid var(--border)',borderRadius:6,padding:'1px 6px'}}>{confirmText}</span> 을 입력하세요</span>
<div style={{height:40,display:'flex',alignItems:'center',padding:'0 18px',border:'1px solid '+(matched?'var(--status-success)':'var(--border-strong)'),borderRadius:'var(--radius-control)',fontSize:13,color:matched?'var(--ink)':'var(--text-muted)'}}>{typed||confirmText+' 입력'}</div>
</div>
<div style={{display:'flex',gap:10,justifyContent:'flex-end',borderTop:'1px solid var(--divider)',paddingTop:16}}>
<button onClick={onCancel} style={{height:38,padding:'0 18px',borderRadius:'var(--radius-control)',border:'1px solid var(--border-strong)',background:'#fff',color:'var(--ink)',fontFamily:'var(--font-sans)',fontSize:13,cursor:'pointer'}}>취소</button>
<button onClick={onConfirm} disabled={!matched||blocked} style={{height:38,padding:'0 18px',borderRadius:'var(--radius-control)',border:'none',background:'var(--status-error)',color:'#fff',fontFamily:'var(--font-sans)',fontSize:13,fontWeight:600,opacity:(!matched||blocked)?0.35:1,cursor:(!matched||blocked)?'default':'pointer'}}>{conflict&&cascade?'영구 삭제':confirmLabel}</button>
</div>
</div>;
}
