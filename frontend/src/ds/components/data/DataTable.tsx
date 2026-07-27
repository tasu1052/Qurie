import React from 'react';
/** Data table: sortable headers, thin row dividers, hover rows. Dense by design — not Maia-loose.
 * columns: [{key,label,sortable,align,width,render(row)}]  rows: object[] */
export function DataTable({columns=[],rows=[],rowKey='id',onRowClick=null,style={}}){
const [sort,setSort]=React.useState(null);
const sorted=React.useMemo(()=>{if(!sort)return rows;const s=[...rows].sort((a,b)=>{const av=a[sort.key],bv=b[sort.key];return (av>bv?1:av<bv?-1:0)*(sort.dir==='asc'?1:-1)});return s},[rows,sort]);
const th={textAlign:'left',fontSize:11,fontWeight:600,letterSpacing:'var(--ls-caps)',textTransform:'uppercase',color:'var(--text-secondary)',padding:'10px 16px',borderBottom:'1px solid var(--border-strong)',whiteSpace:'nowrap',userSelect:'none'};
return <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'var(--font-sans)',fontSize:14,background:'var(--surface-card)',...style}}>
<thead><tr>
{columns.map(c=><th key={c.key} onClick={()=>{if(!c.sortable)return;setSort(s=>s&&s.key===c.key?{key:c.key,dir:s.dir==='asc'?'desc':'asc'}:{key:c.key,dir:'asc'})}} style={{...th,textAlign:c.align||'left',width:c.width,cursor:c.sortable?'pointer':'default',color:sort&&sort.key===c.key?'var(--accent)':th.color}}>
{c.label}{c.sortable&&<span style={{marginLeft:4,fontSize:9,opacity:sort&&sort.key===c.key?1:0.4}}>{sort&&sort.key===c.key?(sort.dir==='asc'?'▲':'▼'):'▲'}</span>}
</th>)}
</tr></thead>
<tbody>
{sorted.map((r,i)=><tr key={r[rowKey]??i} onClick={onRowClick?()=>onRowClick(r):undefined} style={{cursor:onRowClick?'pointer':'default'}}
onMouseEnter={e=>e.currentTarget.style.background='var(--surface-hover)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
{columns.map(c=><td key={c.key} style={{padding:'var(--table-cell-pad)',borderBottom:'1px solid var(--divider)',color:'var(--text-body)',textAlign:c.align||'left',verticalAlign:'middle'}}>{c.render?c.render(r):r[c.key]}</td>)}
</tr>)}
</tbody>
</table>;
}
