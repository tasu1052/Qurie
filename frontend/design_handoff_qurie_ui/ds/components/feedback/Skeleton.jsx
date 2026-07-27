import React from 'react';
/** Calm opacity-pulse placeholder — no shimmer gradient (gradients are banned). */
export function Skeleton({width='100%',height=12,radius=6,circle=false,delay=0,animate=true,style={}}){
return <div aria-hidden="true" style={{width:circle?height:width,height,borderRadius:circle?'50%':radius,background:'rgba(17,17,17,0.07)',animation:animate?`qurie-skeleton 1.4s ease-in-out ${delay}s infinite`:'none',...style}}/>;
}
export function SkeletonText({lines=3,gap=10,widths=['100%','92%','64%'],style={}}){
return <div style={{display:'flex',flexDirection:'column',gap,...style}}>
{Array.from({length:lines}).map((_,i)=><Skeleton key={i} width={widths[i%widths.length]} delay={i*0.08}/>)}
</div>;
}
