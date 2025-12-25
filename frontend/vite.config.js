import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        port: 5173, // 确保端口一致
        proxy: {
            '/api': {
                target: 'http://localhost:9961', // 后端地址
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        },
        // --- 新增: 开启 SharedArrayBuffer 支持 ---
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }
    },
    // --- 新增: 优化 FFmpeg 依赖加载 ---
    optimizeDeps: {
        exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
    }
})