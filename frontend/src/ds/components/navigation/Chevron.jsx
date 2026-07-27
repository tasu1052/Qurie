import React from 'react';
/** Type-rendered brand chevron ">" — Qurie's signature accent shape. */
export function Chevron({color='var(--accent)',size=14,style={}}){
return <span aria-hidden="true" style={{color,fontSize:size,fontWeight:600,fontFamily:'var(--font-sans)',lineHeight:1,display:'inline-block',...style}}>&gt;</span>;
}
