import React from 'react';
import {NOISE_TEXTURE} from '../texture.js';
const L={warning:{fg:'var(--status-warning)',bg:'var(--status-warning-bg)',label:'주의'},danger:{fg:'var(--status-error)',bg:'var(--status-error-bg)',label:'위험'}};
export function RiskBadge({level='warning',label,style={}}){
const t=L[level]||L.warning;
return <span style={{display:'inline-flex',alignItems:'center',gap:5,
backgroundColor:`color-mix(in srgb, ${t.bg} 62%, transparent)`,
backgroundImage:NOISE_TEXTURE,
boxShadow:`inset 0 0 0 1px color-mix(in srgb, ${t.fg} 18%, transparent), inset 0 1px 0 color-mix(in srgb, var(--text-inverse) 50%, transparent)`,
color:t.fg,borderRadius:'var(--radius-control)',padding:'3px 10px',fontFamily:'var(--font-sans)',fontSize:10.5,fontWeight:600,letterSpacing:'0.06em',...style}}>{label||t.label}</span>;
}
