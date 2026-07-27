import React from 'react';
import { ErrorState } from './ErrorState';
/**
 * One grid row = one load boundary. The page shell (Sidebar/Topbar/Footer) renders
 * immediately; each row resolves on its own and a failed row never blocks the others.
 * `skeleton` must occupy the same height as the loaded content so nothing shifts.
 */
export function RowSection({status='ready',skeleton=null,errorTitle='이 영역을 불러오지 못했습니다',errorDescription='이 행만 실패했습니다. 나머지 영역은 정상적으로 표시됩니다.',onRetry,children,style={}}){
return <section aria-busy={status==='loading'} style={{display:'flex',flexDirection:'column',gap:8,...style}}>
{status==='loading'&&skeleton}
{status==='error'&&<div style={{background:'var(--surface-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)'}}>
<ErrorState title={errorTitle} description={errorDescription} actionLabel="이 행만 다시 시도" onRetry={onRetry} style={{padding:'28px 24px'}}/>
</div>}
{status==='ready'&&children}
{status==='empty'&&children}
</section>;
}
