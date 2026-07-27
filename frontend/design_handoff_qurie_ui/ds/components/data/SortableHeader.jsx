import React from 'react';
/** Header cell that owns one sort key. Cycles unsorted → asc → desc → unsorted. */
export function SortableHeader({label,sortKey,sort,index,onSort,style={}}){
const active=sort&&sort.key===sortKey;
const dir=active?sort.dir:null;
const next=dir==='asc'?'desc':dir==='desc'?null:'asc';
return <span role="button" onClick={()=>onSort&&onSort(next?{key:sortKey,dir:next}:null)} style={{display:'inline-flex',alignItems:'center',gap:5,fontFamily:'var(--font-sans)',fontSize:11,fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase',color:active?'var(--accent)':'var(--text-secondary)',cursor:'pointer',userSelect:'none',...style}}>
{label}
<span aria-hidden="true" style={{fontSize:10,color:active?'var(--accent)':'var(--border-strong)'}}>{dir==='asc'?'↑':dir==='desc'?'↓':'↕'}</span>
{active&&index!=null&&<span style={{fontFamily:'var(--font-mono)',fontSize:9.5,background:'var(--accent-soft)',borderRadius:'var(--radius-control)',padding:'0 5px'}}>{index}</span>}
</span>;
}
