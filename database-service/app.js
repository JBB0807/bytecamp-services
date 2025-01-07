const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();
// require('dotenv').config(); // prisma client already loads .env apparently, double check before deploying
const port = process.env.NODE_PORT; // Use env for port
console.log('NODE_PORT:', port);

const prisma = new PrismaClient();

app.use(express.json());

// Endpoint to fetch custom query (avoid raw queries if possible)
app.get('/query', async (req, res) => {
  // double check if user is admin first from jwt
  const query = req.body.query
  const response = prisma.$queryRaw`${query}`;
  res.status(400).json({ error: 'Custom queries are not supported.' });
});

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


// Add a new user
app.post('/add-user', async (req, res) => {
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


// sign up endpoint for new users:
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
