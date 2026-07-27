import React from 'react';
import {StatCard} from './StatCard';

function ScrollArrow({d,minWidth,gap,scrollRef}){
  const nudge=()=>{const el=scrollRef.current;if(el)el.scrollBy({left:d*(minWidth+gap),behavior:'smooth'});};
  return <button type="button" onClick={nudge} aria-label={d>0?'다음 카드':'이전 카드'} style={{position:'absolute',top:'50%',transform:'translateY(-50%)',...(d>0?{right:-10}:{left:-10}),width:32,height:32,borderRadius:999,border:'1px solid var(--border-strong)',background:'var(--surface-card)',boxShadow:'var(--shadow-card)',color:'var(--accent)',fontSize:17,fontWeight:700,lineHeight:1,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2,fontFamily:'var(--font-sans)',padding:0}}>{d>0?'›':'‹'}</button>;
}

/** Horizontal KPI row. Every card shares one uniform size (`grid-auto-columns`).
 * When the viewport shrinks, cards DO NOT resize or wrap — the row scrolls and a
 * round chevron arrow appears at the overflowing edge to page through hidden cards. */
export function StatCardRow({items=null,minWidth=250,gap=24,children=null,style={}}){
const ref=React.useRef(null);
const [can,setCan]=React.useState({l:false,r:false});
const update=React.useCallback(()=>{const el=ref.current;if(!el)return;setCan(c=>{const l=el.scrollLeft>4,r=el.scrollLeft+el.clientWidth<el.scrollWidth-4;return c.l===l&&c.r===r?c:{l,r};});},[]);
React.useEffect(()=>{update();const el=ref.current;if(!el)return;const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(update):null;if(ro)ro.observe(el);el.addEventListener('scroll',update,{passive:true});return()=>{if(ro)ro.disconnect();el.removeEventListener('scroll',update);};},[update]);
const cards=children||((items||[]).map((it,i)=>React.createElement(StatCard,{key:i,...it})));
return <div style={{position:'relative',minWidth:0,...style}}>
<div ref={ref} style={{display:'grid',gridAutoFlow:'column',gridAutoColumns:`minmax(${minWidth}px, 1fr)`,gap,overflowX:'auto',scrollbarWidth:'none',minWidth:0}}>
{cards}
</div>
{can.l&&<ScrollArrow d={-1} minWidth={minWidth} gap={gap} scrollRef={ref}/>}
{can.r&&<ScrollArrow d={1} minWidth={minWidth} gap={gap} scrollRef={ref}/>}
</div>;
}
