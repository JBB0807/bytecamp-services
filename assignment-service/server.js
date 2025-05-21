require("dotenv").config();
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");

const axios = require("axios");

const express = require("express");
const AWS = require("aws-sdk");
const instructorRouter = require("./routes/InstructorRouter");
const studentRouter = require("./routes/StudentRouter");

const DEPLOY_API_URL = process.env.DEPLOY_API_URL || "http://localhost:3600";

// const s3 = new AWS.S3({
//   endpoint: process.env.AWS_ENDPOINT_URL_S3,
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
//   s3ForcePathStyle: true,
// });
// const BUCKET = process.env.COMMON_BUCKET;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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
// );

app.use("/instructor", instructorRouter);
app.use("/student", studentRouter);

app.get("/", (req, res) => {
  res.send("OK");
});

app.get("/notebook/save/:appname", async (req, res) => {
});

app.get("/notebook/:appName", async (req, res) => {
  try {
    const { appName } = req.params;
    console.log(`Fetching notebook for appName: ${appName}`);

    const response = await axios.get(`${DEPLOY_API_URL}/notebook/${appName}`);
    if (response.status !== 200) {
      console.log(`Failed to restart app for appName: ${appName}`);
      return res.status(500).json({ error: "Failed to restart app" });
    }
    
    console.log(`Notebook data received for appName: ${appName}`);
    res.status(200).json(response.data);

  } catch (error) {
    console.error("Failed to load notebook:", error);
    res.status(500).json({ error: "Failed to load notebook" });
  }
});

const port = process.env.NODE_PORT || 8080;
app.listen({ port: port, host: "::", ipv6Only: false }, () =>
  console.log(`Listening on ${port}...`)
);
