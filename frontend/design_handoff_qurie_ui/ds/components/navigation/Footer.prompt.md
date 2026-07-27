# Footer

Page footer marking build provenance: `Q>rie` wordmark left, `© 2026 Qurie · 현재 데모 버전` right.

Rules (lint-enforced):
- Every page with a `<main>` content region ends with `<Footer />` as its last child
  (`margin-top: auto` pins it down in a flex column).
- Exempt: immersive surfaces without `<main>` — code editor / live Room, modals.
- 12px `--text-muted`, hairline `--divider` top border. Nothing else goes in the
  footer — no nav links, no socials (marketing/landing pages keep their own footer).

```jsx
<main style={{display:'flex',flexDirection:'column',gap:24}}>
  …page content…
  <Footer />
</main>
```
