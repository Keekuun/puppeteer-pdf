# puppeteer-pdf

基于 Puppeteer 的 PDF 文档生成服务

## 功能特性

- 🚀 基于 Express + Puppeteer 构建
- 📄 支持HTML模板生成 PDF 
- 📝 使用 Handlebars 模板引擎
- 🎯 TypeScript 支持
- ⚡ Vite 构建优化

## 技术栈

- Node.js
- TypeScript
- Express
- Puppeteer
- Handlebars
- Vite

## 安装

```bash
# 使用 pnpm 安装依赖
pnpm install

# 安装 Puppeteer Chrome
pnpm prepare
```

## 开发

```bash
# 启动开发服务器
pnpm dev
```

## 构建

```bash
# 构建生产版本
pnpm build
```

## 部署

```bash
# 启动生产服务
pnpm start
```

## API 接口测试

### 测试生成发票 PDF

```http
POST /api/generate
Content-Type: application/json

{
  "billId": "ORDER_12345"
}
```

<iframe src="./temp/invoice-ORDER_12345-1752119673807.pdf" width="100%" height="300px"></iframe>

### 测试生成表格 PDF

```http
POST /api/report
Content-Type: application/json

{
  "reportId": "ORD-2023-12345"
}
```
<iframe src="./temp/report-ORD-2023-12345-1752119692106" width="100%" height="300px"></iframe>

## 项目结构

```
src/
  ├── assets/        # 静态资源
  ├── routes/        # 路由定义
  ├── services/      # 业务逻辑
  └── templates/     # PDF 模板文件
```

## 注意事项

- 生成的 PDF 文件默认保存在 temp 目录下
- 确保系统已安装 Chrome 浏览器
- Node.js 版本要求 >= 16

## License

[MIT License](LICENSE)
