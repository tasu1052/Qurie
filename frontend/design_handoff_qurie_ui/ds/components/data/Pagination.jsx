import React from 'react';
export function Pagination({page=1,pageCount=1,pageSize=12,rangeLabel,onPage,onPageSize}){
const pages=[];
for(let i=1;i<=pageCount;i++){ if(i===1||i===pageCount||Math.abs(i-page)<=1) pages.push(i); else if(pages[pages.length-1]!=='…') pages.push('…'); }
const btn={minWidth:30,height:30,padding:'0 10px',borderRadius:'var(--radius-control)',border:'1px solid var(--border-strong)',background:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'var(--ink)',cursor:'pointer'};
return <div style={{display:'flex',alignItems:'center',gap:10,fontFamily:'var(--font-sans)'}}>
{rangeLabel&&<span style={{fontSize:12,color:'var(--text-muted)'}}>{rangeLabel}</span>}
<div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
<button onClick={()=>onPage&&onPage(page-1)} disabled={page<=1} style={{...btn,minWidth:30,padding:0,opacity:page<=1?0.4:1}}>‹</button>
{pages.map((n,i)=>n==='…'
?<span key={'g'+i} style={{color:'var(--text-muted)',fontSize:12,padding:'0 2px'}}>…</span>
:<button key={n} onClick={()=>onPage&&onPage(n)} style={n===page?{...btn,background:'var(--ink)',color:'#fff',border:'none',fontWeight:600}:btn}>{n}</button>)}
<button onClick={()=>onPage&&onPage(page+1)} disabled={page>=pageCount} style={{...btn,minWidth:30,padding:0,opacity:page>=pageCount?0.4:1}}>›</button>
</div>
<button onClick={()=>onPageSize&&onPageSize(pageSize)} style={{...btn,height:30,color:'var(--text-secondary)'}}>{pageSize}개 ▾</button>
</div>;
}
export function LoadMore({label,loading=false,onClick}){
return <button onClick={onClick} disabled={loading} style={{height:38,width:'100%',borderRadius:'var(--radius-control)',border:'1px solid var(--border-strong)',background:'#fff',fontFamily:'var(--font-sans)',fontSize:13,color:loading?'var(--text-muted)':'var(--ink)',cursor:loading?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
{loading&&<span style={{width:12,height:12,borderRadius:'50%',border:'2px solid var(--border-strong)',borderTopColor:'var(--accent)',animation:'qurie-spin .9s linear infinite'}}/>}
{loading?'불러오는 중':label}
</button>;
}
