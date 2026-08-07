import React from 'react';
/** Vertical bar chart, ink bars with single indigo highlight.
 * data: [{label,value,highlight?}]
 * nowrap 라벨 때문에 막대가 많아지면 카드 폭보다 넓어진다 — 컨테이너를 뚫고 나가는 대신
 * 넘칠 때만 하단 가로 스크롤이 생기도록 스크롤 래퍼로 감싼다. */
export function BarChart({data=[],height=180,maxValue=null,showValues=false,style={}}){
const max=maxValue??Math.max(...data.map(d=>d.value),1);
return <div style={{overflowX:'auto',overflowY:'hidden',...style}}>
<div style={{display:'inline-flex',alignItems:'flex-end',gap:12,height,minWidth:'100%',fontFamily:'var(--font-sans)'}}>
{data.map((d,i)=><div key={i} style={{flex:'1 0 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:6,height:'100%',justifyContent:'flex-end'}}>
{showValues&&<span style={{fontSize:11,fontWeight:600,color:d.highlight?'var(--accent)':'var(--text-secondary)',fontVariantNumeric:'tabular-nums'}}>{d.value}</span>}
<div title={`${d.label}: ${d.value}`} style={{width:'100%',maxWidth:36,height:`${Math.max(2,(d.value/max)*100)}%`,background:d.highlight?'var(--chart-accent)':'var(--chart-primary)',borderRadius:'6px 6px 0 0',transition:'height 300ms ease-out'}}></div>
<span style={{fontSize:11,color:'var(--text-muted)',whiteSpace:'nowrap'}}>{d.label}</span>
</div>)}
</div>
</div>;
}
