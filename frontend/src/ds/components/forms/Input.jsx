import React from 'react';
export function Input({type='text',placeholder='',value,onChange,shortcut=null,icon=null,disabled=false,width=260,style={},autoComplete,name}){
const [focus,setFocus]=React.useState(false);
return <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'var(--surface-card)',border:`1px solid ${focus?'var(--accent)':'var(--border-strong)'}`,boxShadow:focus?'0 0 0 2px var(--accent-soft)':'none',borderRadius:'var(--radius-control)',padding:'0 14px',height:'var(--control-h-md)',boxSizing:'border-box',width,opacity:disabled?0.45:1,transition:'border-color 140ms ease-out,box-shadow 140ms ease-out',...style}}>
{icon&&<span style={{color:'var(--text-muted)',display:'flex'}}>{icon}</span>}
<input type={type} placeholder={placeholder} value={value} onChange={onChange} disabled={disabled} autoComplete={autoComplete} name={name} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} style={{border:'none',outline:'none',background:'transparent',flex:1,minWidth:0,fontFamily:'var(--font-sans)',fontSize:14,color:'var(--ink)'}}/>
{shortcut&&<kbd style={{fontFamily:'var(--font-sans)',fontSize:11,color:'var(--text-muted)',background:'var(--surface-sunken)',border:'1px solid var(--border)',borderRadius:'var(--radius-pill)',padding:'2px 8px',lineHeight:1.4}}>{shortcut}</kbd>}
</div>;
}
