import React from 'react';
export function FileDropzone({title,description,hint,actionLabel='파일 선택',secondary=null,onSelect,style={}}){
return <div style={{border:'1.5px dashed var(--border-strong)',borderRadius:'var(--radius-md)',padding:'20px 14px',display:'flex',flexDirection:'column',alignItems:'center',gap:10,background:'var(--surface-sunken)',textAlign:'center',fontFamily:'var(--font-sans)',width:'100%',boxSizing:'border-box',...style}}>
<span style={{width:44,height:44,borderRadius:'50%',background:'var(--surface-card)',border:'1px solid var(--border)',display:'inline-flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',fontSize:12,fontWeight:600,flexShrink:0}}>업로드</span>
<span style={{fontSize:14,fontWeight:600,color:'var(--ink)',lineHeight:1.35}}>{title}</span>
{description&&<span style={{fontSize:12.5,color:'var(--text-secondary)',maxWidth:320,lineHeight:1.45,textWrap:'pretty'}}>{description}</span>}
<div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4,alignItems:'stretch',width:'100%',maxWidth:220}}>
<button type="button" onClick={onSelect} style={{height:36,padding:'0 14px',borderRadius:'var(--radius-control)',border:'none',background:'var(--ink)',color:'#fff',fontFamily:'var(--font-sans)',fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',lineHeight:1,width:'100%',boxSizing:'border-box'}}>{actionLabel}</button>
{secondary? <div style={{width:'100%',display:'flex',justifyContent:'stretch'}}>{secondary}</div> : null}
</div>
{hint&&<span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)',lineHeight:1.4}}>{hint}</span>}
</div>;
}
export function UploadRow({name,percent=null,error=null,onCancel,onRetry}){
const failed=!!error;
return <div style={{display:'flex',alignItems:'center',gap:12,border:'1px solid '+(failed?'rgba(178,70,70,0.22)':'var(--border)'),background:failed?'var(--status-error-bg)':'#fff',borderRadius:'var(--radius-md)',padding:'14px 16px',fontFamily:'var(--font-sans)'}}>
<div style={{flex:1,display:'flex',flexDirection:'column',gap:failed?2:7,minWidth:0}}>
<div style={{display:'flex',justifyContent:'space-between',fontSize:12.5,gap:8}}>
<span style={{color:failed?'var(--status-error)':'var(--ink)',fontWeight:failed?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{failed?'업로드에 실패했습니다':name}</span>
{!failed&&percent!=null&&<span style={{fontFamily:'var(--font-mono)',fontSize:11.5,color:'var(--text-secondary)',flexShrink:0}}>{percent}%</span>}
</div>
{failed
?<span style={{fontSize:12,color:'var(--text-secondary)'}}>{error}</span>
:<div style={{height:6,borderRadius:'var(--radius-control)',background:'var(--surface-sunken)',overflow:'hidden'}}><div style={{width:(percent||0)+'%',height:'100%',background:'var(--accent)',borderRadius:'var(--radius-control)'}}/></div>}
</div>
{failed
?<button type="button" onClick={onRetry} style={{height:30,padding:'0 14px',borderRadius:'var(--radius-control)',border:'1px solid var(--border-strong)',background:'#fff',fontFamily:'var(--font-sans)',fontSize:12,color:'var(--ink)',cursor:'pointer',whiteSpace:'nowrap',lineHeight:1,flexShrink:0}}>다시 선택</button>
:<button type="button" onClick={onCancel} style={{border:'none',background:'transparent',color:'var(--text-muted)',cursor:'pointer',fontFamily:'var(--font-sans)',fontSize:12,padding:0,whiteSpace:'nowrap',lineHeight:1,flexShrink:0}}>취소</button>}
</div>;
}
