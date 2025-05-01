const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 8080;

// Middleware to handle dynamic IPv6 proxying
app.use('/:ipv6', (req, res, next) => {
  const ipv6 = req.params.ipv6;

  // Validate or sanitize the IPv6 if needed
  const targetUrl = `http://[${ipv6}]:8000`;
  console.log(`Proxying request to: ${targetUrl}`);

  // Create and attach the proxy middleware *once per request*
  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    logLevel: 'debug',
    // pathRewrite: {
    //   [`^/${ipv6}`]: '/', // Send to root of the target
    // },
    onError(err, req, res) {
      console.error('Proxy error:', err.message);
      res.status(502).send('Bad Gateway: Failed to connect to target');
    }
  });

  return proxy(req, res, next);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Proxy server listening on http://0.0.0.0:${port}`);
});
