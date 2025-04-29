require('dotenv').config();
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");

const express = require("express");
const instructorRouter = require("./routes/InstructorRouter");
const studentRouter = require("./routes/StudentRouter");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// app.use(
//     session({
//         secret: process.env.AUTH_SESSION_KEY,
//         resave: false,
//         saveUninitialized: false,
//         cookie: {
//             maxAge: 24 * 60 * 60 * 1000, // 1 day
//         },
//     })
// );

// app.use(passport.initialize());
// app.use(passport.session());

// app.use(
//     cors({
//         origin: process.env.ACCEPTED_ORIGINS.split(","),
//         methods: ["GET", "POST"],
//         credentials: true,
//     })
// )

app.use("/instructor", instructorRouter);
app.use("/student", studentRouter);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}...`));