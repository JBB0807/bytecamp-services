const { createProxyMiddleware } = require("http-proxy-middleware");
const api = require("express").Router();

const ASSIGNMENT_SERVICE_URL = process.env.ASSIGNMENT_SERVICE_URL;

api.use(
  '/',  
  createProxyMiddleware({
    target: ASSIGNMENT_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/api': '', // remove "/api" from the start
    },
    onProxyReq(proxyReq, req, res) {
      console.log(`Proxying request to: ${ASSIGNMENT_SERVICE_URL}${req.url}`);
    },
    onError(err, req, res) {
      console.error('Proxy error:', err.message);
      res.status(502).send('Bad Gateway: Failed to connect to target');
    }
  })
);

module.exports = api;
