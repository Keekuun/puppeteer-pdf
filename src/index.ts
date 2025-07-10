import express from 'express';
import pdfRoutes from './routes/pdfRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// 使用中间件来解析JSON请求体
app.use(express.json());

// 挂载PDF路由
app.use('/api/pdf', pdfRoutes);

app.get('/ping', (req, res) => {
  res.send({ msg: 'pong' });
});

app.get('/', (req, res) => {
  res.send('PDF Generation Service is running!');
});

// 注意：在开发模式下，我们不需要自己调用 app.listen()
// vite-plugin-node 会为我们处理服务器的启动和监听。
// 但为了生产环境，我们通常会这样做：
if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, () => {
    console.log(`Production Server is running on http://localhost:${PORT}`);
  });
}

export const viteNodeApp = app;
