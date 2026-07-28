import React from 'react';
import {NOISE_TEXTURE} from '../texture.js';
/* Glass status badge: translucent status tint + noise texture, hairline inset
   ring + top highlight instead of a border (no layout shift). No backdrop-filter:
   chips sit inside scroll rows where it triggers compositing artifacts. */
export function Badge({status='neutral',children,style={}}){
const map={success:['var(--status-success)','var(--status-success-bg)'],warning:['var(--status-warning)','var(--status-warning-bg)'],error:['var(--status-error)','var(--status-error-bg)'],neutral:['var(--status-neutral)','var(--status-neutral-bg)'],accent:['var(--status-accent)','var(--status-accent-bg)'],ink:['var(--text-inverse)','var(--ink)']};
const [fg,bg]=map[status]||map.neutral;
const ink=status==='ink';
return <span style={{display:'inline-flex',alignItems:'center',gap:5,
backgroundColor:`color-mix(in srgb, ${bg} ${ink?85:62}%, transparent)`,
backgroundImage:NOISE_TEXTURE,
boxShadow:`inset 0 0 0 1px color-mix(in srgb, ${ink?'var(--text-inverse)':fg} 18%, transparent), inset 0 1px 0 color-mix(in srgb, var(--text-inverse) ${ink?14:50}%, transparent)`,
color:fg,borderRadius:'var(--radius-pill)',padding:'3px 10px',fontSize:11,fontWeight:600,letterSpacing:'var(--ls-caps)',textTransform:'uppercase',fontFamily:'var(--font-sans)',lineHeight:1.5,whiteSpace:'nowrap',...style}}>{children}</span>;
}
