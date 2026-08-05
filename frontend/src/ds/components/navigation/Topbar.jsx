import React from 'react';
import {Input} from '../forms/Input';
import {Chevron} from './Chevron';
/** Topbar: breadcrumbs (chevron-separated), optional search, actions slot, account chip. */
export function Topbar({
  breadcrumbs=[],
  searchPlaceholder='검색 또는 명령…',
  onSearch,
  actions=null,
  userName='관리자',
  userRole=null,
  userEmail=null,
  searchIcon=null,
  hideSearch=false,
  onUserClick,
  leading=null,
  className='',
  style={},
}){
const lastIndex=breadcrumbs.length-1;
return <header className={`qurie-topbar${className?` ${className}`:''}`} style={{height:'var(--topbar-height)',background:'var(--surface-card)',backdropFilter:'var(--surface-blur)',WebkitBackdropFilter:'var(--surface-blur)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:16,padding:'0 20px',boxSizing:'border-box',fontFamily:'var(--font-sans)',position:'relative',zIndex:60,minWidth:0,width:'100%',maxWidth:'100%',flexShrink:0,...style}}>
{leading}
<div className="qurie-topbar__crumbs" style={{display:'flex',alignItems:'center',gap:8,fontSize:14,minWidth:0,flex:'1 1 auto',overflow:'hidden'}}>
{breadcrumbs.map((b,i)=><React.Fragment key={i}>
{i>0&&<span className={i===lastIndex?'qurie-topbar__chevron qurie-topbar__chevron--before-last':'qurie-topbar__chevron'} aria-hidden="true"><Chevron size={11} color="var(--text-muted)"/></span>}
<span className={i<lastIndex?'qurie-topbar__crumb qurie-topbar__crumb--prefix':'qurie-topbar__crumb qurie-topbar__crumb--current'} style={{color:i===lastIndex?'var(--ink)':'var(--text-secondary)',fontWeight:i===lastIndex?600:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b}</span>
</React.Fragment>)}
</div>
<div className="qurie-topbar__actions" style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
{!hideSearch&&<Input className="qurie-topbar__search" placeholder={searchPlaceholder} shortcut="⌘K" icon={searchIcon} onChange={onSearch} width={240}/>}
{actions}
<div
  className="qurie-topbar__user"
  role={onUserClick?'button':undefined}
  tabIndex={onUserClick?0:undefined}
  onClick={onUserClick}
  onKeyDown={onUserClick?(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onUserClick();}}:undefined}
  style={{display:'flex',alignItems:'center',gap:8,cursor:onUserClick?'pointer':'default',padding:'4px 6px',borderRadius:'var(--radius-pill)',minWidth:0}}
>
<span className="qurie-topbar__avatar" style={{width:28,height:28,borderRadius:'50%',background:'var(--accent-soft)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{(userName||'?').slice(0,1)}</span>
<div className="qurie-topbar__user-text" style={{display:'flex',flexDirection:'column',lineHeight:1.2,minWidth:0}}>
<span style={{fontSize:13,fontWeight:600,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{userName}</span>
{(userEmail||userRole)&&<span className="qurie-topbar__user-role" style={{fontSize:11,color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{userEmail||userRole}</span>}
</div>
</div>
</div>
</header>;
}
