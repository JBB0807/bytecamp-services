const express = require("express");
const adminRouter = express.Router();

// Endpoint to fetch custom query (avoid raw queries if possible)
adminRouter.get('/query', async (req, res) => {
    // double check if user is admin first from jwt
    const query = req.body.query
    const response = prisma.$queryRaw`${query}`;
    res.status(400).json({ error: 'Custom queries are not supported.' });
  });

  module.exports = adminRouter;
