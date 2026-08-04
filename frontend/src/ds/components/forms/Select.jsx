import React from 'react';
export function Select({options=[],value,onChange,size='md',disabled=false,style={}}){
const [open,setOpen]=React.useState(false);
const ref=React.useRef(null);
React.useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[]);
const cur=options.find(o=>(o.value??o)===value)??options[0];
const label=o=>o?.label??o;
const pad=size==='sm'?'5px 12px':'8px 16px';
const pick=(v)=>{setOpen(false);if(onChange)onChange(v);};
return <div ref={ref} style={{position:'relative',display:'inline-block',...style}}>
<button type="button" disabled={disabled} onClick={()=>setOpen(o=>!o)} style={{display:'inline-flex',alignItems:'center',gap:6,background:'var(--surface-card)',border:'1px solid var(--border-strong)',borderRadius:'var(--radius-control)',padding:pad,fontFamily:'var(--font-sans)',fontSize:size==='sm'?12:14,fontWeight:500,color:'var(--ink)',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.45:1}}>
{label(cur)}<span style={{color:'var(--text-muted)',fontSize:size==='sm'?9:10,transform:'rotate(90deg)',fontWeight:600}}>&gt;</span>
</button>
{open&&<div style={{position:'absolute',top:'calc(100% + 4px)',left:0,minWidth:'100%',background:'var(--surface-card)',border:'1px solid var(--border-strong)',borderRadius:'var(--radius-md)',boxShadow:'var(--shadow-popover)',padding:5,zIndex:30}}>
{options.map((o,i)=>{const v=o.value??o;const sel=v===value;
return <div key={i} role="option" aria-selected={sel} onMouseDown={(e)=>{e.preventDefault();e.stopPropagation();pick(v);}} style={{padding:'6px 12px',borderRadius:'var(--radius-sm)',fontSize:size==='sm'?12:13,fontFamily:'var(--font-sans)',fontWeight:sel?600:400,color:sel?'var(--accent)':'var(--ink)',background:sel?'var(--accent-softer)':'transparent',cursor:'pointer',whiteSpace:'nowrap'}}
onMouseEnter={e=>{if(!sel)e.currentTarget.style.background='var(--surface-hover)'}} onMouseLeave={e=>{if(!sel)e.currentTarget.style.background='transparent'}}>{label(o)}</div>})}
</div>}
</div>;
}
