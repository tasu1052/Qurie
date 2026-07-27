// Qurie frontend design conventions — ESLint flat config (ESLint 9+).
// Any agent (Claude Code included) writing UI in this repo is subject to these rules.
// For TypeScript files, add typescript-eslint's parser to languageOptions per usual.
import qurie from './tools/eslint-plugin-qurie/index.js';

export default [
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    ignores: ['node_modules/**', 'dist/**', 'build/**'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { qurie },
    rules: {
      /* StatCard: delta sits right of the value — green ↑ increase / red ↓ decrease,
         numeric only, nothing else. Rows are uniform and scroll with edge arrows. */
      'qurie/statcard-delta': 'error',
      'qurie/statcard-in-row': 'error',
      /* Charts: swatch-box legend outside every plot; never color words in copy. */
      'qurie/chart-legend': 'error',
      'qurie/no-color-word-label': 'error',
      /* Foundations: token colors only, flat surfaces, no emoji, Maia radii. */
      'qurie/no-raw-color': 'error',
      'qurie/no-gradient': 'error',
      'qurie/no-emoji': 'error',
      'qurie/radius-token': 'warn',
      /* Typography: Qurie type scale, weights 400–700 (800 = brand mark only), token font stacks. */
      'qurie/font-size-scale': 'warn',
      'qurie/font-weight-scale': 'warn',
      'qurie/font-family-token': 'error',
      /* Tech icons: assets/{tech}_{size}.png naming + alt text. */
      'qurie/tech-icon': 'error',
      /* Async states: DS feedback components only; errors and empties offer a way forward. */
      'qurie/state-components': 'error',
      'qurie/state-action': 'error',
      'qurie/shell-outside-state': 'error',
      /* Async boundaries belong to the data layer; the UI layer supplies both fallbacks. */
      'qurie/boundary-fallbacks': 'error',
      /* Destructive actions: type-the-name confirmation, never window.confirm. */
      'qurie/destructive-confirm': 'error',
      /* Page chrome: every <main> page closes with the DS <Footer />. */
      'qurie/page-footer': 'error',
      /* One component source of truth: no external UI/chart/styling libraries. */
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@mui/*', 'antd', 'antd/*', 'bootstrap', 'bootstrap/*', 'recharts', 'recharts/*', 'chart.js', 'chart.js/*', 'echarts', 'echarts/*', 'styled-components', '@emotion/*'],
          message: 'Use Qurie DS components (ds/components) and token CSS — no external UI, chart, or CSS-in-JS libraries.',
        }],
      }],
    },
  },
  /* Token stylesheets & their JS mirrors are where raw colors are defined. */
  {
    files: ['**/tokens/**'],
    rules: { 'qurie/no-raw-color': 'off', 'qurie/font-family-token': 'off' },
  },
];
