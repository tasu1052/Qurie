import React from 'react';
/** Shared chart legend — the one element every chart type carries OUTSIDE the plot.
 * Renders a color swatch box + series name ("▪ 서울 2반"), never color words ("ink: 서울 2반").
 * items: [{label, accent?, color?}] — accent → indigo swatch; unnamed colors follow the
 * ink/grey chart palette in series order. */
export function ChartLegend({items=[],align='left',style={}}){
const jc=align==='center'?'center':align==='right'?'flex-end':'flex-start';
const palette=['var(--chart-primary)','var(--grey-400)','var(--grey-200)','var(--grey-100)'];
let gi=0;
return <div style={{display:'flex',flexWrap:'wrap',gap:'6px 16px',justifyContent:jc,fontSize:12,color:'var(--text-secondary)',fontFamily:'var(--font-sans)',...style}}>
{items.map((it,i)=><span key={i} style={{display:'inline-flex',alignItems:'center',gap:6,whiteSpace:'nowrap'}}>
<span style={{width:10,height:10,borderRadius:3,background:it.color||(it.accent?'var(--chart-accent)':palette[gi++%palette.length]),flexShrink:0}}></span>
{it.label}</span>)}
</div>;
}
