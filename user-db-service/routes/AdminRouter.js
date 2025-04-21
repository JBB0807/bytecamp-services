const express = require("express");
const adminRouter = express.Router();

// Endpoint to fetch custom query (avoid raw queries if possible)
adminRouter.get('/query', async (req, res) => {
    // double check if user is admin first from jwt
    const query = req.body.query
    const response = prisma.$queryRaw`${query}`;
    res.status(400).json({ error: 'Custom queries are not supported.' });
  });

// Fetch top users (update logic as per your requirements)
adminRouter.get('/update', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' }, // Example sorting
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = adminRouter;
