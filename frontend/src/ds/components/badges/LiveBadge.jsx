import React from 'react';
import {Badge} from './Badge.jsx';

/**
 * LIVE status badge: DS accent Badge + breathing glow + ping dot.
 * Glow keyframes live in styles/index.css (`qurie-live-glow`).
 *
 * width/alignSelf/justifySelf stay content-sized so CSS Grid cells
 * (e.g. manager Session List) cannot stretch the glow wrapper larger
 * than the pill — that was the size mismatch on /manager/sessions.
 */
export function LiveBadge({children='LIVE',style={}}){
return <span style={{
display:'inline-flex',
width:'fit-content',
maxWidth:'100%',
alignSelf:'center',
justifySelf:'start',
borderRadius:'var(--radius-pill)',
animation:'qurie-live-glow 2.2s ease-in-out infinite',
...style,
}}>
<Badge status="accent">
<span className="qurie-live-dot" aria-hidden="true"/>
{children}
</Badge>
</span>;
}
