require('dotenv').config();

const cors = require("cors");
const express = require("express");
const passport = require("passport");
const passportSetup = require("./passport");
const authRoute = require("./routes/auth");
const session = require("express-session");

const app = express();

app.use(
    session({
        secret: process.env.AUTH_SESSION_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
    cors({
        origin: process.env.ACCEPTED_ORIGINS.split(","),
        methods: ["GET", "POST"],
        credentials: true,
    })
)

app.use("/auth", authRoute);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}...`));