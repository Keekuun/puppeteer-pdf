import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // ... 其他 Vite 配置 ...

  // 告诉 Vite 这是为 SSR (服务器端渲染) 构建的，虽然我们是纯后端，但这个模式最接近
  ssr: {
    // Puppeteer 包含一些不能被 Vite 正确处理的特殊依赖，将其排除，让 Node.js 自己去 node_modules 里找
    noExternal: ['pdf-lib'], // 确保 Vite 转换这个库以兼容
    external: ['puppeteer'],
  },

  server: {
    // Vite Dev Server 的配置
    host: 'localhost', // 监听的地址
    port: 3001 // 监听的端口
  },

  plugins: [
    // 启用路径别名插件
    tsconfigPaths(),
    // VitePluginNode 的核心配置
    ...VitePluginNode({
      // The adapter to use. Defaults to 'express'.
      // Other options include 'koa', 'fastify', 'nest', or a custom function.
      adapter: 'express',
      // The path to you app's main file.
      appPath: 'src/index.ts',
      // The name of the exported app in your app's main file.
      exportName: 'viteNodeApp',
      // Optional, default: 'esbuild'
      // The TypeScript compiler you want to use
      // by default this plugin is using vite default ts compiler which is esbuild
      // 'swc' compiler is supported to use as well for frameworks
      // like Nestjs (esbuild dont support 'emitDecoratorMetadata' yet)
      // you need to INSTALL `@swc/core` as dev dependency if you want to use swc
      tsCompiler: 'esbuild', // or 'swc'
      // Optional, default: false
      // if you want to reload your app on file changes, set this to true, rebounce delay is 500ms
      reloadAppOnFileChange: true,
    })
  ],

  // 构建选项
  build: {
    // 输出目录
    outDir: 'dist',
    // 确保构建产物是 CommonJS 格式，因为我们的 tsconfig 和 Node 环境更适应它
    ssr: true,
    rollupOptions: {
      // 确保 puppeteer 是外部依赖，不会被打包进去
      external: ['puppeteer'],
    }
  }
});
