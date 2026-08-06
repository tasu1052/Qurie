import React from 'react';
/** Persistent left nav. items: [{key,label,icon,active?,badge?}].
 * Account/footer slot is pinned to the bottom of the viewport (sticky + 100vh)
 * with clear separation from nav items above.
 * Pass logoSrc=null in dark mode (AppShell) so the text brand stays readable —
 * the PNG has near-black glyphs on a dark plate. */
export function Sidebar({items=[],activeKey,onSelect,collapsed=false,footer=null,logoSrc=null,brand='Q>rie',style={}}){
const w=collapsed?'var(--sidebar-width-collapsed)':'var(--sidebar-width)';
return <nav style={{width:w,minWidth:w,height:'100vh',position:'sticky',top:0,background:'var(--surface-card)',backdropFilter:'var(--surface-blur)',WebkitBackdropFilter:'var(--surface-blur)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',padding:'16px 12px',gap:4,boxSizing:'border-box',fontFamily:'var(--font-sans)',transition:'width 180ms ease-out',...style}}>
<div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 10px 16px',minHeight:44,flexShrink:0}}>
{logoSrc?<img src={logoSrc} alt={brand} className="sidebar-logo" style={{height:'var(--logo-height)',width:'auto',objectFit:'contain',objectPosition:'left',display:'block'}}/>:
<span style={{fontSize:18,fontWeight:700,color:'var(--ink)',letterSpacing:'-0.02em',whiteSpace:'nowrap',lineHeight:1}}>Q<span style={{color:'var(--accent)',fontWeight:800}}>&gt;</span>{collapsed?'':'rie'}</span>}
</div>
<div style={{display:'flex',flexDirection:'column',gap:4,flex:1,minHeight:0,overflowY:'auto'}}>
{items.map(it=>{const active=it.key===activeKey;
return <button key={it.key} onClick={()=>onSelect&&onSelect(it.key)} title={it.label} style={{display:'flex',alignItems:'center',gap:10,padding:collapsed?'9px':'9px 14px',justifyContent:collapsed?'center':'flex-start',borderRadius:'var(--radius-pill)',border:'none',background:active?'var(--accent-softer)':'transparent',color:active?'var(--accent)':'var(--text-secondary)',fontSize:14,fontWeight:active?600:500,fontFamily:'var(--font-sans)',cursor:'pointer',width:'100%',textAlign:'left',transition:'background 140ms ease-out'}}
onMouseEnter={e=>{if(!active)e.currentTarget.style.background='var(--surface-hover)'}} onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent'}}>
<span style={{display:'flex',width:18,justifyContent:'center',flexShrink:0}}>{it.icon}</span>
{!collapsed&&<span style={{flex:1,minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{it.label}</span>}
{!collapsed&&it.badge!=null&&<span style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',background:'var(--surface-sunken)',borderRadius:'var(--radius-pill)',padding:'1px 7px'}}>{it.badge}</span>}
</button>})}
</div>
{footer!=null&&<div style={{marginTop:'auto',paddingTop:24,flexShrink:0}}>{footer}</div>}
</nav>;
}
