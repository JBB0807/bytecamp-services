const express = require("express");
const studenRouter = express.Router();

// Add a new student
studenRouter.post('/add-user', async (req, res) => {
    try {
      const { username, email } = req.body;
      const newUser = await prisma.user.create({
        data: { username, email },
      });
      res.json({ message: 'User added successfully', user: newUser });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  module.exports = studenRouter;
