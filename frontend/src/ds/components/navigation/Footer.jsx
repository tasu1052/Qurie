import React from 'react';
/** Page footer — closes every page that has a main content region (editor/room
 * surfaces are exempt). Left: Q>rie wordmark. Right: "© {year} Qurie · {note}". */
export function Footer({year=2026,note='현재 데모 버전',style={}}){
return <footer style={{marginTop:'auto',paddingTop:16,borderTop:'1px solid var(--divider)',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:12,color:'var(--text-muted)',fontFamily:'var(--font-sans)',...style}}>
<span style={{fontWeight:700,fontSize:13,color:'var(--text-secondary)',letterSpacing:'-0.01em'}}>Q<span style={{color:'var(--accent)',fontWeight:800}}>&gt;</span>rie</span>
<span>© {year} Qurie · {note}</span>
</footer>;
}
