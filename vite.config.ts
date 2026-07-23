import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    const API_PORT = env.API_PORT || process.env.API_PORT || '3001';

    // Chuyển tiếp mọi lời gọi dữ liệu tới API server Node đang nói chuyện với
    // PostgreSQL local. Nhờ vậy API chỉ cần lắng nghe trên 127.0.0.1 và trình
    // duyệt không gặp vấn đề CORS.
    const apiProxy = {
      '/api': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: false,
      },
    };

    return {
      // strictPort: nếu cổng 3000 đã bị chiếm, Vite mặc định tự nhảy sang cổng
      // khác — và có thể rơi đúng vào cổng của API server, khiến mọi truy vấn
      // dữ liệu hỏng một cách khó hiểu. Thà báo lỗi ngay còn hơn chạy sai.
      server: {
        port: 3000,
        strictPort: true,
        host: '0.0.0.0',
        proxy: apiProxy,
      },
      preview: {
        port: 3000,
        strictPort: true,
        host: '0.0.0.0',
        proxy: apiProxy,
      },
      plugins: [
        react(),
        tailwindcss(),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
