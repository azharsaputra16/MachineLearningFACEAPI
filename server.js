const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

//
// ===============================
// 🔥 SINGLE CLEAN PROXY ONLY
// ===============================
// Frontend call: /api/*
// Redirect to: http://localhost/webprojek/api/*
// (Apache XAMPP)
app.use(
  '/api',
  createProxyMiddleware({
    target: 'http://localhost',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/webprojek/api'
    },
    logLevel: 'debug',

    onError: (err, req, res) => {
      console.error('[API PROXY ERROR]', err.message);
      res.status(500).json({
        success: false,
        error: 'Proxy API error',
        detail: err.message
      });
    }
  })
);

//
// ===============================
// 🌐 PAGE ROUTES (FRONTEND ONLY)
// ===============================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard-work-timer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard-work-timer.html'));
});

app.get('/ml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ml-index.html'));
});

//
// ===============================
// 📁 OPTIONAL: direct public access
// ===============================
app.get('/public/:page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.params.page));
});

//
// ===============================
// 🚀 START SERVER
// ===============================
const server = app.listen(PORT, () => {
  console.log(`[OK] Server running: http://localhost:${PORT}`);
  console.log(`[OK] Frontend: http://localhost:${PORT}`);
  console.log(`[OK] API Proxy: /api → http://localhost/webprojek/api`);
  console.log(`[OK] Apache target: http://localhost/webprojek`);
});

//
// ===============================
// 🛠 ERROR HANDLER
// ===============================
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[ERROR] Port ${PORT} sudah dipakai`);
  } else {
    console.error('[SERVER ERROR]', err);
  }
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[PROMISE ERROR]', reason);
});