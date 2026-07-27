import React from 'react';
const SIZES={sm:14,md:20,lg:28};
export function Spinner({size='md',tone='accent',label=null,style={}}){
const px=SIZES[size]||SIZES.md;
const top=tone==='inverse'?'#fff':tone==='warning'?'var(--status-warning)':'var(--accent)';
const track=tone==='inverse'?'rgba(255,255,255,0.32)':'var(--border-strong)';
const ring=<span aria-hidden="true" style={{width:px,height:px,borderRadius:'50%',border:`${px>=28?2.5:2}px solid ${track}`,borderTopColor:top,animation:'qurie-spin .9s linear infinite',flex:'none'}}/>;
if(!label) return <span role="status" aria-label="로딩 중" style={style}>{ring}</span>;
return <span role="status" style={{display:'inline-flex',alignItems:'center',gap:9,fontFamily:'var(--font-sans)',fontSize:13,color:tone==='inverse'?'#fff':'var(--text-secondary)',...style}}>{ring}{label}</span>;
}
