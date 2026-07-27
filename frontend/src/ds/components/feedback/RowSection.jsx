import React from 'react';
/**
 * One grid row = one async boundary. The data layer owns the boundary component
 * (<QueryAsyncBoundary suspenseFallback errorFallback>); the UI layer owns this
 * row shell and the two fallbacks it is given.
 *
 *   <QueryAsyncBoundary suspenseFallback={<RowSkeleton height={132} />}
 *                       errorFallback={<RowErrorFallback onRetry={refetch} />}>
 *     <RowSection label="row 1 · kpi"><KpiRow /></RowSection>
 *   </QueryAsyncBoundary>
 *
 * RowSection itself never switches on status — Suspense and the error boundary do.
 */
export function RowSection({label=null,children,style={}}){
return <section style={{display:'flex',flexDirection:'column',gap:8,...style}}>
{label&&<span style={{fontFamily:'var(--font-mono)',fontSize:10.5,color:'var(--text-muted)'}}>{label}</span>}
{children}
</section>;
}
/** Suspense fallback for a row: reserves the loaded row's exact height. */
export function RowSkeleton({height=132,columns=1,gap=16,radius=16,style={}}){
return <div aria-hidden="true" style={{display:'grid',gridTemplateColumns:'repeat('+columns+',minmax(0,1fr))',gap,...style}}>
{Array.from({length:columns}).map((_,i)=>
<div key={i} style={{height,borderRadius:radius,background:'#fff',border:'1px solid var(--border)',padding:20,display:'flex',flexDirection:'column',gap:14}}>
<div style={{width:76,height:11,borderRadius:6,background:'rgba(17,17,17,0.07)',animation:'qurie-skeleton 1.4s ease-in-out '+(i*0.08)+'s infinite'}}/>
<div style={{width:104,height:30,borderRadius:8,background:'rgba(17,17,17,0.09)',animation:'qurie-skeleton 1.4s ease-in-out '+(i*0.08+0.1)+'s infinite'}}/>
<div style={{width:60,height:10,borderRadius:6,background:'rgba(17,17,17,0.05)',animation:'qurie-skeleton 1.4s ease-in-out '+(i*0.08+0.2)+'s infinite'}}/>
</div>)}
</div>;
}
/** Error fallback for a row: scoped to this row, never the page. */
export function RowErrorFallback({title='이 영역을 불러오지 못했습니다',description='이 행만 실패했습니다. 나머지 영역은 정상적으로 표시됩니다.',requestId=null,onRetry,style={}}){
return <div role="alert" style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'28px 24px',display:'flex',alignItems:'center',gap:16,fontFamily:'var(--font-sans)',...style}}>
<span style={{width:36,height:36,borderRadius:'50%',background:'var(--status-error-bg)',color:'var(--status-error)',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>!</span>
<div style={{display:'flex',flexDirection:'column',gap:3}}>
<span style={{fontSize:14,fontWeight:600,color:'var(--ink)'}}>{title}</span>
<span style={{fontSize:12,color:'var(--text-secondary)'}}>{description}</span>
{requestId&&<span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)'}}>request_id: {requestId}</span>}
</div>
<button onClick={onRetry} style={{marginLeft:'auto',height:32,padding:'0 16px',borderRadius:'var(--radius-control)',border:'1px solid var(--border-strong)',background:'#fff',fontFamily:'var(--font-sans)',fontSize:12,color:'var(--ink)',cursor:'pointer'}}>이 행만 다시 시도</button>
</div>;
}
