const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = Number(process.env.PORT || 3000);


// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Proxy PHP API to XAMPP (Apache) so frontend can run fully with Node.
// Assumes Apache listens at http://localhost and project is in /webprojek
// and the PHP files live in /webprojek/api.
app.use(
  '/api',
  createProxyMiddleware({
    target: 'http://localhost:80',
    changeOrigin: true,
    // Pastikan path diteruskan ke /webprojek/api/*
    pathRewrite: (path) => path.replace(/^\/api/, '/webprojek/api'),
    logLevel: 'debug',
    onError: (err, req, res) => {
      console.error('[proxy /api] error', err && err.message);
      res.status(500).json({ error: 'Proxy /api error', details: String(err && err.message) });
    }
  })
);



app.use(
  ['/webprojek/api', '/webprojek/public'],
  createProxyMiddleware({
    target: 'http://localhost',
    changeOrigin: true,
  })
);

// Ensure client-side pages under /public can be visited via Node
app.get('/api/get_faces.php', async (req, res) => {
  // Proxy spesifik agar path tidak salah (backend PHP mengembalikan JSON array)
  try {
    const http = require('http');
    http.get('http://localhost:80/webprojek/api/get_faces.php', (resp) => {
      let body = '';
      resp.on('data', (chunk) => (body += chunk));
      resp.on('end', () => {
        res.status(resp.statusCode || 200);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.send(body);
      });
    }).on('error', (err) => {
      res.status(500).json({ error: 'Proxy get_faces failed', details: String(err && err.message) });
    });
  } catch (e) {
    res.status(500).json({ error: 'Proxy get_faces exception', details: String(e && e.message) });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});


// Redirect /public/* to the actual file in /public folder
app.get('/public/:page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.params.page));
});

// Convenience routes: /dashboard and /ml-index
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard-work-timer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard-work-timer.html'));
});

app.get('/ml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ml-index.html'));
});


const server = app.listen(PORT, () => {
  console.log(`[server.js] Node server running: http://localhost:${PORT}`);
  console.log('[server.js] Static: d:/xampp/htdocs/webprojek/public');
  console.log('[server.js] API proxied to Apache (PHP): http://localhost/webprojek/api');
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`[server.js] Port ${PORT} already in use. Set PORT env var to another value (example: PORT=3001) and restart.`);
  } else {
    console.error('[server.js] Server error:', err);
  }
});

process.on('uncaughtException', (err) => {
  console.error('[server.js] uncaughtException:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[server.js] unhandledRejection:', reason);
});


