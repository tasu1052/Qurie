import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // y-monaco가 쓰는 구식 딥 경로 — monaco 0.5x exports 맵이 막아서 실제 파일로 매핑
      'monaco-editor/esm/vs/editor/editor.api.js': fileURLToPath(
        new URL('./node_modules/monaco-editor/esm/vs/editor/editor.api.js', import.meta.url),
      ),
    },
  },
})
