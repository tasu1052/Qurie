import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // 로컬 백엔드로 붙일 때는 .env 에 VITE_DEV_API_TARGET=http://localhost:8080 을 넣으면 된다.
  const apiTarget = env.VITE_DEV_API_TARGET || 'https://i15a604.p.ssafy.io';

  return {
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
    /*
     * 개발 프록시. 브라우저 입장에서 모든 요청이 localhost:5173 으로 나가므로 same-site 가 되고,
     * 백엔드가 내려주는 SameSite=Lax 쿠키가 정상적으로 저장·전송된다.
     * 절대 URL(https://i15a604...)로 직접 호출하면 cross-site 라 쿠키가 실리지 않아 로그인이 유지되지 않는다.
     * changeOrigin 은 Host 헤더를 대상 도메인으로 바꿔 nginx 의 server_name 매칭을 맞춘다.
     */
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
