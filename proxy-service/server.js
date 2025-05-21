const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 8080;

// Cache proxy instances per target to avoid recreating each time
const proxyCache = new Map();

// Basic IPv6 validation pattern (can be improved or replaced with a library like 'ipaddr.js')
const isValidIPv6 = (ip) => /^[0-9a-fA-F:]+$/.test(ip);

app.use('/:ipv6', (req, res, next) => {
  const ipv6 = req.params.ipv6;

  if (!isValidIPv6(ipv6)) {
    return res.status(400).send('Invalid IPv6 address');
  }

  const targetUrl = `http://[${ipv6}]:8000`;
  console.log(`Proxying to: ${targetUrl}`);

  // Reuse proxy middleware for the same target
  if (!proxyCache.has(targetUrl)) {
    proxyCache.set(targetUrl, createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      logLevel: 'debug',
      pathRewrite: (path, req) => path.replace(`/${ipv6}`, '/'),
      onError(err, req, res) {
        console.error(`Proxy error for ${targetUrl}:`, err.message);
        if (!res.headersSent) {
          res.status(502).send('Bad Gateway: Failed to connect to target');
        }
      }
    }));
  }

  return proxyCache.get(targetUrl)(req, res, next);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Proxy server listening on http://0.0.0.0:${port}`);
});
