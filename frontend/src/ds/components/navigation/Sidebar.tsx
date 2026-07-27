import React from 'react';
import {Chevron} from './Chevron';
/** Persistent left nav. items: [{key,label,icon,active?,badge?}] — pill-shaped items (Maia). */
export function Sidebar({items=[],activeKey,onSelect,collapsed=false,footer=null,logoSrc=null,brand='Q>rie',style={}}){
const w=collapsed?'var(--sidebar-width-collapsed)':'var(--sidebar-width)';
return <nav style={{width:w,minWidth:w,height:'100%',background:'var(--surface-card)',backdropFilter:'var(--surface-blur)',WebkitBackdropFilter:'var(--surface-blur)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',padding:'16px 12px',gap:4,boxSizing:'border-box',fontFamily:'var(--font-sans)',transition:'width 180ms ease-out',...style}}>
<div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 10px 16px',minHeight:36}}>
{logoSrc?<img src={logoSrc} alt={brand} style={{height:22,objectFit:'contain',objectPosition:'left'}}/>:
<span style={{fontSize:18,fontWeight:700,color:'var(--ink)',letterSpacing:'-0.02em',whiteSpace:'nowrap'}}>{collapsed?<>Q<Chevron size={16}/></>:<>Q<Chevron size={16}/>rie</>}</span>}
</div>
{items.map(it=>{const active=it.key===activeKey;
return <button key={it.key} onClick={()=>onSelect&&onSelect(it.key)} title={it.label} style={{display:'flex',alignItems:'center',gap:10,padding:collapsed?'9px':'9px 14px',justifyContent:collapsed?'center':'flex-start',borderRadius:'var(--radius-pill)',border:'none',background:active?'var(--accent-softer)':'transparent',color:active?'var(--accent)':'var(--text-secondary)',fontSize:14,fontWeight:active?600:500,fontFamily:'var(--font-sans)',cursor:'pointer',width:'100%',textAlign:'left',transition:'background 140ms ease-out'}}
onMouseEnter={e=>{if(!active)e.currentTarget.style.background='var(--surface-hover)'}} onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent'}}>
<span style={{display:'flex',width:18,justifyContent:'center',flexShrink:0}}>{it.icon}</span>
{!collapsed&&<span style={{flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{it.label}</span>}
{!collapsed&&it.badge!=null&&<span style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',background:'var(--surface-sunken)',borderRadius:'var(--radius-pill)',padding:'1px 7px'}}>{it.badge}</span>}
</button>})}
<div style={{marginTop:'auto'}}>{footer}</div>
</nav>;
}
