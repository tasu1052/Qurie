'use strict';
/**
 * eslint-plugin-qurie — Qurie Design System frontend conventions.
 * Encodes the design rules any agent (Claude Code included) must follow when
 * writing UI in this repo. Pair with eslint.config.mjs at the repo root.
 */

const RAW_COLOR_RE = /(#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(|\boklch\s*\()/;
const GRADIENT_RE = /\bgradient\s*\(/i;
const COLOR_WORD_LABEL_RE = /\b(ink|indigo|grey|gray|green|red|blue|amber|slate)\s*[:：]/i;
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const NUMERIC_DELTA_RE = /^[+\-−]\s*[\d.]/;
const RADIUS_SCALE = [0, 2, 3, 4, 6, 8, 10, 12, 16, 20, 999];
/* Qurie type scale: caption 10-13.5 (12 default), body 14, H3 17, H2 22, H1 28, KPI 36-44, display 79. */
const FONT_SIZE_SCALE = [10, 11, 12, 12.5, 13, 13.5, 14, 17, 22, 28, 36, 40, 44, 79];
const FONT_WEIGHT_SCALE = [400, 500, 600, 700, 800];

function jsxTagName(node) {
  const n = node.name;
  if (!n) return null;
  if (n.type === 'JSXIdentifier') return n.name;
  if (n.type === 'JSXMemberExpression') return n.property.name; // NS.StatCard -> StatCard
  return null;
}
function getAttr(node, name) {
  return (node.attributes || []).find(
    a => a.type === 'JSXAttribute' && a.name && a.name.name === name
  );
}
function literalValue(attr) {
  if (!attr || !attr.value) return undefined;
  if (attr.value.type === 'Literal') return attr.value.value;
  if (attr.value.type === 'JSXExpressionContainer' && attr.value.expression.type === 'Literal')
    return attr.value.expression.value;
  return undefined;
}
function hasAncestorTag(node, tag) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'JSXElement' && jsxTagName(p.openingElement) === tag) return true;
  }
  return false;
}
function siblingsInclude(node, tags, depthUp = 2) {
  let el = node;
  for (let d = 0; d < depthUp; d++) {
    const parent = el.parent && (el.parent.type === 'JSXElement' || el.parent.type === 'JSXFragment') ? el.parent : null;
    if (!parent) return false;
    const found = (parent.children || []).some(
      c => c.type === 'JSXElement' && tags.includes(jsxTagName(c.openingElement))
    );
    if (found) return true;
    el = parent;
  }
  return false;
}

module.exports = {
  meta: { name: 'eslint-plugin-qurie', version: '1.0.0' },
  rules: {
    /* ── Async states ─────────────────────────────────────────────────── */
    'state-components': {
      meta: {
        type: 'problem',
        docs: { description: 'Loading and error states come from the DS feedback components — no ad-hoc loading text or hand-rolled skeleton/spinner markup.' },
        messages: {
          text: 'Ad-hoc loading copy "{{val}}": render <Spinner label="…" /> for actions or <Skeleton> for first paint.',
          markup: 'Hand-rolled "{{val}}" element: use <Skeleton>, <Spinner>, or <ProgressBar> from ds/components/feedback.',
        },
      },
      create(ctx) {
        const TEXT_RE = /^(로딩\s*중|불러오는\s*중|loading[.…\s]*|please wait)$/i;
        const CLASS_RE = /(skeleton|shimmer|spinner|loader)/i;
        return {
          JSXText(node) {
            const val = String(node.value || '').trim();
            if (val && TEXT_RE.test(val)) ctx.report({ node, messageId: 'text', data: { val } });
          },
          JSXAttribute(node) {
            const name = node.name && node.name.name;
            if (name !== 'className' && name !== 'class') return;
            const val = literalValue(node);
            if (typeof val === 'string' && CLASS_RE.test(val)) ctx.report({ node, messageId: 'markup', data: { val } });
          },
        };
      },
    },
    'shell-outside-state': {
      meta: {
        type: 'problem',
        docs: { description: 'Shell chrome (Sidebar/Topbar/Header/Navbar/Footer) renders immediately — never inside a row load boundary.' },
        messages: { shell: '<{{tag}}> is page shell: render it outside <RowSection> / skeleton / error boundaries so it paints before any data arrives.' },
      },
      create(ctx) {
        const SHELL = ['Sidebar', 'Topbar', 'Header', 'Navbar', 'Footer'];
        return {
          JSXElement(node) {
            const tag = jsxTagName(node.openingElement);
            if (!SHELL.includes(tag)) return;
            if (hasAncestorTag(node, 'RowSection') || hasAncestorTag(node, 'Skeleton') || hasAncestorTag(node, 'ErrorState')) {
              ctx.report({ node: node.openingElement, messageId: 'shell', data: { tag } });
            }
          },
        };
      },
    },
    'state-action': {
      meta: {
        type: 'problem',
        docs: { description: 'Error and empty states always offer one way forward (retry, or a primary CTA).' },
        messages: {
          retry: '<ErrorState> needs a way forward: pass actionLabel + onRetry (or actionLabel={null} only when the page itself is the recovery).',
          cta: '<EmptyState> needs one clear CTA: pass actionLabel + onAction.',
        },
      },
      create(ctx) {
        return {
          JSXOpeningElement(node) {
            const tag = jsxTagName(node);
            if (tag === 'ErrorState') {
              const a = getAttr(node, 'actionLabel');
              const r = getAttr(node, 'onRetry');
              if (!a && !r) ctx.report({ node, messageId: 'retry' });
            } else if (tag === 'EmptyState') {
              if (!getAttr(node, 'actionLabel')) ctx.report({ node, messageId: 'cta' });
            }
          },
        };
      },
    },
    /* ── StatCard ─────────────────────────────────────────────────────── */
    'statcard-delta': {
      meta: {
        type: 'problem',
        docs: { description: 'StatCard delta: signed numeric only; green ↑ up / red ↓ down; direction must match the sign.' },
        messages: {
          nonNumeric: 'StatCard `delta` accepts a signed numeric change only ("+2.1%", "-3"). Put status text ("{{val}}") in `caption`.',
          mismatch: 'StatCard `deltaDirection="{{dir}}"` contradicts the delta sign of "{{val}}". Increase = green ↑, decrease = red ↓ — omit deltaDirection and let the sign decide.',
        },
      },
      create(ctx) {
        return {
          JSXOpeningElement(node) {
            if (jsxTagName(node) !== 'StatCard') return;
            const deltaAttr = getAttr(node, 'delta');
            const val = literalValue(deltaAttr);
            if (typeof val !== 'string') return;
            if (!NUMERIC_DELTA_RE.test(val.trim())) {
              ctx.report({ node: deltaAttr, messageId: 'nonNumeric', data: { val } });
              return;
            }
            const dir = literalValue(getAttr(node, 'deltaDirection'));
            const sign = val.trim().startsWith('-') || val.trim().startsWith('−') ? 'down' : 'up';
            if ((dir === 'up' || dir === 'down') && dir !== sign) {
              ctx.report({ node, messageId: 'mismatch', data: { dir, val } });
            }
          },
        };
      },
    },
    'statcard-in-row': {
      meta: {
        type: 'problem',
        docs: { description: 'StatCards live inside <StatCardRow> so a row keeps uniform card sizes and gains overflow arrows on narrow viewports.' },
        messages: { wrap: 'Wrap <StatCard> in <StatCardRow>: cards in a row share one uniform size and never shrink — the row scrolls with edge arrows instead.' },
      },
      create(ctx) {
        return {
          JSXElement(node) {
            if (jsxTagName(node.openingElement) !== 'StatCard') return;
            if (!hasAncestorTag(node, 'StatCardRow')) ctx.report({ node: node.openingElement, messageId: 'wrap' });
          },
        };
      },
    },
    /* ── Charts ───────────────────────────────────────────────────────── */
    'chart-legend': {
      meta: {
        type: 'problem',
        docs: { description: 'Every LineChart/BarChart carries a <ChartLegend> outside the plot (DonutChart has one built in).' },
        messages: { legend: '<{{tag}}> needs a sibling <ChartLegend> (color-swatch box + series name) below the plot. Never describe colors in text.' },
      },
      create(ctx) {
        return {
          JSXElement(node) {
            const tag = jsxTagName(node.openingElement);
            if (tag !== 'LineChart' && tag !== 'BarChart') return;
            if (!siblingsInclude(node, ['ChartLegend'], 3)) {
              ctx.report({ node: node.openingElement, messageId: 'legend', data: { tag } });
            }
          },
        };
      },
    },
    'no-color-word-label': {
      meta: {
        type: 'problem',
        docs: { description: 'Never name colors in UI copy ("ink: 서울 2반") — a ChartLegend swatch carries the color.' },
        messages: { word: 'Color-word label "{{text}}" — render a <ChartLegend> swatch instead of naming the color.' },
      },
      create(ctx) {
        const check = (node, text) => {
          if (typeof text === 'string' && COLOR_WORD_LABEL_RE.test(text)) {
            ctx.report({ node, messageId: 'word', data: { text: text.trim().slice(0, 40) } });
          }
        };
        return {
          JSXText(node) { check(node, node.value); },
          Literal(node) { if (node.parent && node.parent.type !== 'ImportDeclaration') check(node, node.value); },
        };
      },
    },
    /* ── Tokens & surfaces ────────────────────────────────────────────── */
    'no-raw-color': {
      meta: {
        type: 'problem',
        docs: { description: 'Colors come from tokens (var(--…)) — no hex/rgb/hsl/oklch literals outside ds/tokens.' },
        messages: { raw: 'Raw color "{{val}}" — use a token from ds/tokens/colors.css (e.g. var(--accent), var(--status-success)).' },
      },
      create(ctx) {
        if (/[\\/]tokens[\\/]/.test(ctx.filename || '')) return {};
        return {
          Literal(node) {
            if (typeof node.value !== 'string' || !RAW_COLOR_RE.test(node.value)) return;
            ctx.report({ node, messageId: 'raw', data: { val: String(node.value).slice(0, 40) } });
          },
          TemplateElement(node) {
            if (RAW_COLOR_RE.test(node.value.raw)) ctx.report({ node, messageId: 'raw', data: { val: node.value.raw.slice(0, 40) } });
          },
        };
      },
    },
    'no-gradient': {
      meta: {
        type: 'problem',
        docs: { description: 'Qurie surfaces are flat solid colors — gradients are never used.' },
        messages: { grad: 'No gradients in Qurie — use a flat token color.' },
      },
      create(ctx) {
        return {
          Literal(node) { if (typeof node.value === 'string' && GRADIENT_RE.test(node.value)) ctx.report({ node, messageId: 'grad' }); },
          TemplateElement(node) { if (GRADIENT_RE.test(node.value.raw)) ctx.report({ node, messageId: 'grad' }); },
        };
      },
    },
    'no-emoji': {
      meta: {
        type: 'problem',
        docs: { description: 'No emoji anywhere. Lucide icons or utility glyphs (⌘K, ⋯, ↑↓) only.' },
        messages: { emoji: 'Emoji are not part of the Qurie voice — use a Lucide icon or plain text.' },
      },
      create(ctx) {
        const check = (node, text) => { if (typeof text === 'string' && EMOJI_RE.test(text)) ctx.report({ node, messageId: 'emoji' }); };
        return {
          JSXText(node) { check(node, node.value); },
          Literal(node) { check(node, node.value); },
        };
      },
    },
    'radius-token': {
      meta: {
        type: 'suggestion',
        docs: { description: 'borderRadius values come from the Maia scale: pill controls (999), 16 cards, 20 modals, 12 popovers.' },
        messages: { radius: 'borderRadius {{val}} is off the scale ({{scale}}). Use a radius token (--radius-control, --radius-lg, --radius-xl, --radius-md).' },
      },
      create(ctx) {
        return {
          Property(node) {
            if (!node.key || (node.key.name || node.key.value) !== 'borderRadius') return;
            if (node.value.type === 'Literal' && typeof node.value.value === 'number' && !RADIUS_SCALE.includes(node.value.value)) {
              ctx.report({ node: node.value, messageId: 'radius', data: { val: node.value.value, scale: RADIUS_SCALE.join('/') } });
            }
          },
        };
      },
    },
    /* == Typography ================================================== */
    'font-size-scale': {
      meta: {
        type: 'suggestion',
        docs: { description: 'fontSize sticks to the Qurie type scale: caption 10-13.5, body 14, H3 17, H2 22, H1 28, KPI 36-44 (var(--text-kpi)), display 79.' },
        messages: { size: 'fontSize {{val}} is off the Qurie scale ({{scale}}). Use the nearest step or a token (var(--text-kpi), var(--text-h1)...).' },
      },
      create(ctx) {
        return {
          Property(node) {
            if (!node.key || (node.key.name || node.key.value) !== 'fontSize') return;
            if (node.value.type === 'Literal' && typeof node.value.value === 'number' && !FONT_SIZE_SCALE.includes(node.value.value)) {
              ctx.report({ node: node.value, messageId: 'size', data: { val: node.value.value, scale: FONT_SIZE_SCALE.join('/') } });
            }
          },
        };
      },
    },
    'font-weight-scale': {
      meta: {
        type: 'suggestion',
        docs: { description: 'fontWeight is 400/500/600/700 (800 reserved for the brand chevron/wordmark). No thin (<400) or black (900) weights.' },
        messages: { weight: 'fontWeight {{val}} is off the scale (400/500/600/700; 800 only for the Q>rie chevron/wordmark).' },
      },
      create(ctx) {
        return {
          Property(node) {
            if (!node.key || (node.key.name || node.key.value) !== 'fontWeight') return;
            const v = node.value.type === 'Literal' ? node.value.value : undefined;
            const n = typeof v === 'string' ? parseInt(v, 10) : v;
            if (typeof n === 'number' && !isNaN(n) && !FONT_WEIGHT_SCALE.includes(n)) {
              ctx.report({ node: node.value, messageId: 'weight', data: { val: v } });
            }
          },
        };
      },
    },
    'font-family-token': {
      meta: {
        type: 'problem',
        docs: { description: 'fontFamily comes from tokens: var(--font-sans) (Nunito Sans + Noto Sans KR) or var(--font-mono) (JetBrains Mono) - no raw font stacks outside ds/tokens.' },
        messages: { fam: 'Raw fontFamily "{{val}}" - use var(--font-sans) or var(--font-mono) from tokens/fonts.css.' },
      },
      create(ctx) {
        if (/[\\/]tokens[\\/]/.test(ctx.filename || '')) return {};
        return {
          Property(node) {
            if (!node.key || (node.key.name || node.key.value) !== 'fontFamily') return;
            if (node.value.type === 'Literal' && typeof node.value.value === 'string' && !/^var\(--font-(sans|mono)\)$/.test(node.value.value.trim())) {
              ctx.report({ node: node.value, messageId: 'fam', data: { val: String(node.value.value).slice(0, 50) } });
            }
          },
        };
      },
    },

    /* == Tech icons ================================================== */
    'tech-icon': {
      meta: {
        type: 'problem',
        docs: { description: 'Tech-stack icons are raster assets named assets/{tech}_{size}.png ({tech}_light_{size} on dark surfaces) and always carry alt text. Lucide stays for UI actions.' },
        messages: {
          name: 'Tech icon "{{val}}" breaks the assets/{tech}_{size}.png convention (lowercase tech name, _light variant for dark surfaces).',
          alt: 'Tech icon <img> needs alt text (the tech name, e.g. alt="Java").',
        },
      },
      create(ctx) {
        const ALLOW = /^(logo|favicon)(-[a-z]+)?\.png$/;
        const NAME = /^[a-z0-9]+(_light)?_\d+\.png$/;
        return {
          JSXOpeningElement(node) {
            if (!node.name || node.name.name !== 'img') return;
            const src = (node.attributes || []).find(a => a.type === 'JSXAttribute' && a.name && a.name.name === 'src');
            const v = src && src.value && src.value.type === 'Literal' ? src.value.value : undefined;
            if (typeof v !== 'string' || !/assets\//.test(v)) return;
            const base = v.split('/').pop();
            if (ALLOW.test(base)) return;
            if (!NAME.test(base)) ctx.report({ node: src, messageId: 'name', data: { val: base } });
            const alt = (node.attributes || []).find(a => a.type === 'JSXAttribute' && a.name && a.name.name === 'alt');
            const altVal = alt && alt.value && alt.value.type === 'Literal' ? alt.value.value : undefined;
            if (!altVal) ctx.report({ node, messageId: 'alt' });
          },
        };
      },
    },

    /* == Brand logo ================================================== */
    'brand-logo-png': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Shell brand mark must be assets/logo.png via <Sidebar logoSrc={…}>. Do not substitute a typeset Q>rie wordmark in the sidebar header. Prefer height: var(--logo-height) with width:auto.',
        },
        messages: {
          missing:
            '<Sidebar> needs logoSrc pointing at ds/assets/logo.png — brand mark is the PNG asset, not a typeset wordmark.',
          import:
            'This file renders <Sidebar logoSrc> but never imports assets/logo.png. Import the canonical PNG from ds/assets/logo.png.',
          wordmark:
            'Typeset Q>rie wordmark in a shell/layout file — use <Sidebar logoSrc={logo from ds/assets/logo.png}> instead.',
        },
      },
      create(ctx) {
        const file = ctx.filename || '';
        const inShell = /[\\/](layout|components[\\/]layout|pages)[\\/]/.test(file);
        let sidebarWithLogo = null;
        let importsLogoPng = false;
        return {
          ImportDeclaration(node) {
            const src = node.source && node.source.value;
            if (typeof src === 'string' && /(^|[\\/])logo\.png(\?|$)/.test(src)) {
              importsLogoPng = true;
            }
          },
          JSXOpeningElement(node) {
            if (jsxTagName(node) !== 'Sidebar') return;
            const logoSrc = getAttr(node, 'logoSrc');
            if (!logoSrc) {
              ctx.report({ node, messageId: 'missing' });
              return;
            }
            sidebarWithLogo = node;
          },
          JSXText(node) {
            if (!inShell) return;
            const t = String(node.value || '').replace(/\s+/g, '');
            if (/Q>rie|Q&gt;rie/.test(t)) ctx.report({ node, messageId: 'wordmark' });
          },
          'Program:exit'() {
            if (sidebarWithLogo && !importsLogoPng) {
              ctx.report({ node: sidebarWithLogo, messageId: 'import' });
            }
          },
        };
      },
    },

    /* Lessons from Master Dashboard layout bugs */
    'no-center-shell': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Do not set textAlign/text-align:center on shell or page roots — it inherits into every card. Center only inside EmptyState/ErrorState/FileDropzone.',
        },
        messages: {
          center:
            'textAlign:"center" on a shell/page container inherits into cards. Remove it; center only inside DS feedback/empty components.',
        },
      },
      create(ctx) {
        const file = ctx.filename || '';
        if (!/[\\/](layout|pages)[\\/]/.test(file)) return {};
        return {
          Property(node) {
            const key = node.key && (node.key.name || node.key.value);
            if (key !== 'textAlign' && key !== 'text-align') return;
            const v = node.value.type === 'Literal' ? node.value.value : undefined;
            if (v === 'center') ctx.report({ node: node.value, messageId: 'center' });
          },
        };
      },
    },

    'content-shell': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Page <main> / PageMain must use width:100%, maxWidth:var(--content-max), marginInline:auto, padding:var(--content-pad), minWidth:0.',
        },
        messages: {
          missing:
            'Page main shell is missing content tokens (maxWidth: var(--content-max) and/or padding: var(--content-pad)). See ds/tokens/spacing.css.',
        },
      },
      create(ctx) {
        const file = ctx.filename || '';
        if (!/[\\/](layout|pages)[\\/]/.test(file)) return {};
        function styleHasContentTokens(styleAttr) {
          if (!styleAttr || !styleAttr.value || styleAttr.value.type !== 'JSXExpressionContainer') return false;
          const expr = styleAttr.value.expression;
          if (expr.type !== 'ObjectExpression') return false;
          let hasMax = false, hasPad = false;
          for (const p of expr.properties || []) {
            if (p.type !== 'Property') continue;
            const k = p.key && (p.key.name || p.key.value);
            const lit = p.value.type === 'Literal' ? String(p.value.value) : '';
            if ((k === 'maxWidth' || k === 'max-width') && /--content-max/.test(lit)) hasMax = true;
            if ((k === 'padding') && /--content-pad/.test(lit)) hasPad = true;
          }
          return hasMax && hasPad;
        }
        return {
          JSXOpeningElement(node) {
            const tag = jsxTagName(node);
            // PageMain component or native <main> used as page chrome
            if (tag !== 'main' && tag !== 'PageMain') return;
            if (tag === 'PageMain') return; // defined in layout — checked via its <main>
            if (!styleHasContentTokens(getAttr(node, 'style'))) {
              ctx.report({ node, messageId: 'missing' });
            }
          },
        };
      },
    },

    'statcard-row-scroll': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'KPI StatCards stay in <StatCardRow> which scrolls with edge arrows — do not replace it with a wrapping repeat(var(--grid-kpi)) / auto-fill grid of StatCards.',
        },
        messages: {
          wrap:
            'Do not lay out <StatCard> with a wrapping CSS grid (grid-kpi / auto-fill). Wrap them in <StatCardRow> so overflow uses scroll arrows.',
        },
      },
      create(ctx) {
        return {
          JSXOpeningElement(node) {
            if (jsxTagName(node) !== 'StatCard') return;
            if (hasAncestorTag(node, 'StatCardRow')) return;
            // If a nearby ancestor style uses gridTemplateColumns with auto-fill or grid-kpi, flag
            for (let p = node.parent; p; p = p.parent) {
              if (p.type !== 'JSXElement') continue;
              const style = getAttr(p.openingElement, 'style');
              if (!style || !style.value || style.value.type !== 'JSXExpressionContainer') continue;
              const expr = style.value.expression;
              if (expr.type !== 'ObjectExpression') continue;
              for (const prop of expr.properties || []) {
                if (prop.type !== 'Property') continue;
                const k = prop.key && (prop.key.name || prop.key.value);
                if (k !== 'gridTemplateColumns' && k !== 'grid-template-columns') continue;
                const lit = prop.value.type === 'Literal' ? String(prop.value.value) : '';
                const tmpl = prop.value.type === 'TemplateLiteral'
                  ? prop.value.quasis.map(q => q.value.cooked).join('')
                  : '';
                const val = lit || tmpl;
                if (/auto-fill|auto-fit|--grid-kpi/.test(val)) {
                  ctx.report({ node, messageId: 'wrap' });
                  return;
                }
              }
            }
          },
        };
      },
    },

    'sidebar-footer-pin': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'App shells that render <Sidebar> must pass a footer (account chip). The DS Sidebar pins it to the bottom of the viewport with spacing above the nav items — do not leave the account block inline under the last nav item.',
        },
        messages: {
          missing:
            '<Sidebar> in a layout/shell needs a footer prop (account chip). Sidebar pins it to the viewport bottom with gap from nav items.',
        },
      },
      create(ctx) {
        const file = ctx.filename || '';
        if (!/[\\/](layout|pages)[\\/]/.test(file)) return {};
        return {
          JSXOpeningElement(node) {
            if (jsxTagName(node) !== 'Sidebar') return;
            if (!getAttr(node, 'footer')) {
              ctx.report({ node, messageId: 'missing' });
            }
          },
        };
      },
    },

    /* ── Page chrome ──────────────────────────────────────────────────── */
    'page-footer': {
      meta: {
        type: 'problem',
        docs: { description: 'Every page with a <main> region ends with the DS <Footer /> (© 2026 Qurie · 현재 데모 버전). Editor/Room surfaces without <main> are exempt.' },
        messages: { footer: 'This page renders <main> but no <Footer />. Every content page closes with the DS footer as the last child of <main>.' },
      },
      create(ctx) {
        let mainNode = null, hasFooter = false;
        return {
          JSXOpeningElement(node) {
            const tag = jsxTagName(node);
            if (tag === 'main' && !mainNode) mainNode = node;
            if (tag === 'Footer') hasFooter = true;
          },
          'Program:exit'(program) {
            if (mainNode && !hasFooter) ctx.report({ node: mainNode, messageId: 'footer' });
          },
        };
      },
    },
  },
};
