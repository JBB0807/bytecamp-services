const express = require("express");
const instructorRouter = express.Router();

// For new users sign-up via Google oAuth:
instructorRouter.post('/register-user', async (req, res) => {
    try {
      const { username, password } = req.body;
      const newUser = await prisma.user.create({
        data: { username, email, password },
      });
      res.json({ message: 'User added successfully', user: newUser });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = instructorRouter;
