const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();

const adminRouter = require("./routes/AdminRouter");
const studentRouter = require("./routes/StudentRouter");

// require('dotenv').config(); // prisma client already loads .env apparently, double check before deploying
const port = process.env.NODE_PORT; // Use env for port
console.log('NODE_PORT:', port);

const prisma = new PrismaClient();

app.use(express.json());

//use routes of other pages
app.use("/student", studentRouter);
app.use("/admin", adminRouter);

// Fetch top users (update logic as per your requirements)
app.get('/update', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' }, // Example sorting
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// For new users sign-up via Google oAuth:
app.post('/register-user', async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
