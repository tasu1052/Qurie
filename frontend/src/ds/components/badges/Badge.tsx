import React from 'react';
export function Badge({status='neutral',children,style={}}){
const map={success:['var(--status-success)','var(--status-success-bg)'],warning:['var(--status-warning)','var(--status-warning-bg)'],error:['var(--status-error)','var(--status-error-bg)'],neutral:['var(--status-neutral)','var(--status-neutral-bg)'],accent:['var(--status-accent)','var(--status-accent-bg)'],ink:['var(--text-inverse)','var(--ink)']};
const [fg,bg]=map[status]||map.neutral;
return <span style={{display:'inline-flex',alignItems:'center',gap:5,background:bg,color:fg,borderRadius:'var(--radius-pill)',padding:'3px 10px',fontSize:11,fontWeight:600,letterSpacing:'var(--ls-caps)',textTransform:'uppercase',fontFamily:'var(--font-sans)',lineHeight:1.5,whiteSpace:'nowrap',...style}}>{children}</span>;
}
