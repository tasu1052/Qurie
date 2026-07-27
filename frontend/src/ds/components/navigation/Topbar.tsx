import React from 'react';
import {Input} from '../forms/Input';
import {Chevron} from './Chevron';
/** Topbar: breadcrumbs (chevron-separated), ⌘K search, actions slot, account chip. */
export function Topbar({breadcrumbs=[],searchPlaceholder='검색 또는 명령…',onSearch,actions=null,userName='관리자',userRole=null,searchIcon=null,style={}}){
return <header style={{height:'var(--topbar-height)',background:'var(--surface-card)',backdropFilter:'var(--surface-blur)',WebkitBackdropFilter:'var(--surface-blur)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:16,padding:'0 20px',boxSizing:'border-box',fontFamily:'var(--font-sans)',...style}}>
<div style={{display:'flex',alignItems:'center',gap:8,fontSize:14,minWidth:0}}>
{breadcrumbs.map((b,i)=><React.Fragment key={i}>
{i>0&&<Chevron size={11} color="var(--text-muted)"/>}
<span style={{color:i===breadcrumbs.length-1?'var(--ink)':'var(--text-secondary)',fontWeight:i===breadcrumbs.length-1?600:400,whiteSpace:'nowrap'}}>{b}</span>
</React.Fragment>)}
</div>
<div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:12}}>
<Input placeholder={searchPlaceholder} shortcut="⌘K" icon={searchIcon} onChange={onSearch} width={240}/>
{actions}
<div style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'4px 6px',borderRadius:'var(--radius-pill)'}}>
<span style={{width:28,height:28,borderRadius:'50%',background:'var(--accent-soft)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>{(userName||'?').slice(0,1)}</span>
<div style={{display:'flex',flexDirection:'column',lineHeight:1.2}}>
<span style={{fontSize:13,fontWeight:600,color:'var(--ink)'}}>{userName}</span>
{userRole&&<span style={{fontSize:10,color:'var(--text-muted)',letterSpacing:'var(--ls-caps)'}}>{userRole}</span>}
</div>
</div>
</div>
</header>;
}
