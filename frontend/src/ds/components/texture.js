/* Shared surface texture for the glass recipe.
   SVG feTurbulence noise (desaturated, ~7% opacity) as a data-URI background layer —
   texture without gradients, so it stays inside qurie/no-gradient. */
export const NOISE_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`;

/* Backdrop treatment used by glass chips/banners (cards use --surface-blur). */
export const GLASS_BLUR = 'blur(10px) saturate(1.35)';
