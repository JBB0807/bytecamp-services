require('dotenv').config();

const express = require("express");
const instructorRouter = require("./routes/InstructorRouter");
const studentRouter = require("./routes/StudentRouter");

const app = express();

app.use("/instructor", instructorRouter);
app.use("/student", studentRouter);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}...`));