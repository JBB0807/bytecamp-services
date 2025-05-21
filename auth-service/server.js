require("dotenv").config();

const cors = require("cors");
const express = require("express");
const passport = require("passport");
const passportSetup = require("./passport");
const authRoute = require("./routes/auth");
const apiRoute = require("./routes/api");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// console.log("AUTH_URL:", process.env.AUTH_URL);
const isProduction = process.env.NODE_ENV === "production";
app.use(
  session({
    secret: process.env.AUTH_SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      //keep production security settings below disable for the mean-time because we need to integrate redis session for cross-origin to work properly
      //sameSite: isProduction ? "none" : "lax", // or 'none' if using cross-origin
      //secure: isProduction, // only true in production over HTTPS
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const allowedOrigins = process.env.ACCEPTED_ORIGINS.split(",");

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin); // allow the request
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use("/api", apiRoute);
app.use("/auth", authRoute);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}...`));
