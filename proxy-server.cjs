// CORS 프록시 서버 - LM Studio CORS 우회용
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// CORS 허용
app.use(cors());

// JSON 파싱
app.use(express.json());

// LM Studio 프록시
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:1234',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // /api 제거
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:1234${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy] Error:', err.message);
    res.status(500).json({ error: 'Proxy server error' });
  }
}));

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'OK', proxy: 'LM Studio CORS Proxy' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying LM Studio API from http://localhost:1234`);
  console.log(`✅ CORS enabled for all origins`);
});

module.exports = app;