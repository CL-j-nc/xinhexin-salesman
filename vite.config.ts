import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 注入环境变量，确保在 Cloudflare Pages 构建环境下能抓取到 API_KEY
  const env = loadEnv(mode, process.cwd(), '');

  // 优先级：系统环境变量 > .env 文件变量
  const finalApiKey = process.env.API_KEY || env.API_KEY || "";

  return {
    plugins: [react()],
    server: {
      port: 5173
    },
    build: {
      outDir: 'dist',
    },
    define: {
      // 注入 process.env 变量供前端 getApiKey() 调用
      'process.env.API_KEY': JSON.stringify(finalApiKey),
      // 防止代码中直接访问 process.env (如 const { X } = process.env) 导致报错
      'process.env': JSON.stringify({}),
      // 兼容部分依赖库使用 global 变量
      'global': 'globalThis'
    }
  }
})