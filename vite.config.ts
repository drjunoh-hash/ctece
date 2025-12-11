import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 현재 작업 디렉토리에서 환경 변수를 로드합니다.
  // 세 번째 인자를 ''로 설정하여 VITE_ 접두사가 없는 변수(API_KEY)도 로드합니다.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // 코드 내의 process.env.API_KEY를 실제 환경 변수 값으로 대체합니다.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // 기타 process.env 참조 오류 방지
      'process.env': {}
    }
  };
});