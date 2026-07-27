import React from 'react';
/** Vertical bar chart, ink bars with single indigo highlight.
 * data: [{label,value,highlight?}] */
export function BarChart({data=[],height=180,maxValue=null,showValues=false,style={}}){
const max=maxValue??Math.max(...data.map(d=>d.value),1);
return <div style={{display:'flex',alignItems:'flex-end',gap:12,height,fontFamily:'var(--font-sans)',...style}}>
{data.map((d,i)=><div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6,height:'100%',justifyContent:'flex-end'}}>
{showValues&&<span style={{fontSize:11,fontWeight:600,color:d.highlight?'var(--accent)':'var(--text-secondary)',fontVariantNumeric:'tabular-nums'}}>{d.value}</span>}
<div title={`${d.label}: ${d.value}`} style={{width:'100%',maxWidth:36,height:`${Math.max(2,(d.value/max)*100)}%`,background:d.highlight?'var(--chart-accent)':'var(--chart-primary)',borderRadius:'6px 6px 0 0',transition:'height 300ms ease-out'}}></div>
<span style={{fontSize:11,color:'var(--text-muted)',whiteSpace:'nowrap'}}>{d.label}</span>
</div>)}
</div>;
}
