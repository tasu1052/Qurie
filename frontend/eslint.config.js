import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const qurie = require('./tools/eslint-plugin-qurie/index.js')

export default defineConfig([
  globalIgnores(['dist', 'frontend_tools_tmp/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: { qurie },
    rules: {
      'qurie/statcard-delta': 'error',
      'qurie/statcard-in-row': 'error',
      'qurie/chart-legend': 'error',
      'qurie/no-color-word-label': 'error',
      'qurie/no-raw-color': 'error',
      'qurie/no-gradient': 'error',
      'qurie/no-emoji': 'error',
      'qurie/radius-token': 'warn',
      'qurie/font-size-scale': 'warn',
      'qurie/font-weight-scale': 'warn',
      'qurie/font-family-token': 'error',
      'qurie/tech-icon': 'error',
      'qurie/brand-logo-png': 'error',
      'qurie/no-center-shell': 'error',
      'qurie/content-shell': 'error',
      'qurie/statcard-row-scroll': 'error',
      'qurie/sidebar-footer-pin': 'error',
      'qurie/state-components': 'error',
      'qurie/state-action': 'error',
      'qurie/shell-outside-state': 'error',
      'qurie/page-footer': 'error',
      'qurie/ds-component-placement': 'error',
      'qurie/live-status-badge': 'error',
      'qurie/livebadge-fit-content': 'error',
      'no-restricted-imports': ['error', {
        paths: [{
          name: '../../components/badges/LiveBadge',
          message: 'Import LiveBadge from "../../ds" (ds/components/badges) — not from src/components.',
        }],
        patterns: [{
          group: ['@mui/*', 'antd', 'antd/*', 'bootstrap', 'bootstrap/*', 'recharts', 'recharts/*', 'chart.js', 'chart.js/*', 'echarts', 'echarts/*', 'styled-components', '@emotion/*'],
          message: 'Use Qurie DS components (ds/components) and token CSS — no external UI, chart, or CSS-in-JS libraries.',
        }, {
          group: ['**/components/badges/**', '**/src/components/badges/**'],
          message: 'Badge / LiveBadge / RiskBadge live under src/ds/components/badges — import from "../../ds" (or ds/index).',
        }],
      }],
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { qurie },
    rules: {
      'qurie/ds-component-placement': 'error',
      'qurie/live-status-badge': 'error',
      'qurie/livebadge-fit-content': 'error',
    },
  },
  {
    files: ['**/tokens/**', '**/ds/components/**'],
    rules: {
      'qurie/no-raw-color': 'off',
      'qurie/font-family-token': 'off',
      'qurie/font-size-scale': 'off',
      'qurie/font-weight-scale': 'off',
    },
  },
])
