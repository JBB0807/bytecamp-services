const { createProxyMiddleware } = require("http-proxy-middleware");
const api = require("express").Router();

const ASSIGNMENT_SERVICE_URL = process.env.ASSIGNMENT_SERVICE_URL;

// rerout to asisgnment url
api.use((req, res, next) => {
  console.log(`Proxying request to: ${ASSIGNMENT_SERVICE_URL} : original url : ${req.originalUrl}`);
  next();
});

api.use(
  '/',
  createProxyMiddleware({
    target: ASSIGNMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '', //  only remove /api
    },
  })
);

module.exports = api;
