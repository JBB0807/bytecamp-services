const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();

const adminRouter = require("./routes/AdminRouter");
const instructorRouter = require("./routes/InstructorRouter");
const studentRouter = require("./routes/StudentRouter");

// require('dotenv').config(); // prisma client already loads .env apparently, double check before deploying
const port = process.env.NODE_PORT; // Use env for port
console.log('NODE_PORT:', port);

const prisma = new PrismaClient();

app.use(express.json());

//use routes of other pages
app.use("/student", studentRouter);
app.use("/admin", adminRouter);
app.use("/instructor", instructorRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
