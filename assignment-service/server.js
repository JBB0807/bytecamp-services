require("dotenv").config();
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");

const express = require("express");
const AWS = require("aws-sdk");
const instructorRouter = require("./routes/InstructorRouter");
const studentRouter = require("./routes/StudentRouter");

const s3 = new AWS.S3({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  s3ForcePathStyle: true,
});
const BUCKET = process.env.COMMON_BUCKET;

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
    const prefix = `${appName}/notebooks/`;
    const list = await s3
      .listObjectsV2({ Bucket: BUCKET, Prefix: prefix })
      .promise();
    if (!list.Contents || list.Contents.length === 0) {
      return res.status(404).json({ error: "Notebook not found" });
    }
    const latest = list.Contents.reduce((prev, curr) =>
      prev.LastModified > curr.LastModified ? prev : curr
    );
    const data = await s3
      .getObject({ Bucket: BUCKET, Key: latest.Key })
      .promise();
    res.send(data.Body.toString("utf-8"));
  } catch (error) {
    console.error("Failed to load notebook:", error);
    res.status(500).json({ error: "Failed to load notebook" });
  }
});

const port = process.env.NODE_PORT || 8080;
app.listen({ port: port, host: "::", ipv6Only: false }, () =>
  console.log(`Listening on ${port}...`)
);
