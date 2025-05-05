const intructorRouter = require("express").Router();
const passport = require("passport");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// const {
//   COMMON_BUCKET,
//   AWS_ACCESS_KEY_ID,
//   AWS_SECRET_ACCESS_KEY,
//   AWS_ENDPOINT_URL_S3,
//   AWS_REGION,
// } = process.env;

// Log environment variables for debugging
// console.log('--- ENV START ---');
// console.log('COMMON_BUCKET:        ', COMMON_BUCKET);
// console.log('AWS_ACCESS_KEY_ID:    ', AWS_ACCESS_KEY_ID ? '(found)' : '(NOT SET)');
// console.log('AWS_SECRET_ACCESS_KEY:', AWS_SECRET_ACCESS_KEY ? '(found)' : '(NOT SET)');
// console.log('AWS_ENDPOINT_URL_S3:  ', AWS_ENDPOINT_URL_S3);
// console.log('AWS_REGION:           ', AWS_REGION);
// console.log('--- ENV END   ---');

const DB_ASSIGNMENT_SERVICE_URL =
  process.env.DB_ASSIGNMENT_SERVICE_URL || "http://localhost:3000";

const DEPLOY_API_URL = process.env.DEPLOY_API_URL || "http://localhost:3600";

console.log("DB_ASSIGNMENT_SERVICE_URL:", DB_ASSIGNMENT_SERVICE_URL);
console.log("DEPLOY_API_URL:", DEPLOY_API_URL);


// const s3 = new AWS.S3({
//   endpoint: AWS_ENDPOINT_URL_S3,
//   region: AWS_REGION,
//   credentials: new AWS.Credentials(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY),
//   s3ForcePathStyle: true
// });

// Use memory storage to keep file in RAM
const upload = multer({ storage: multer.memoryStorage() });

// This endpoint is for instructors to create a new assignment
intructorRouter.post(
  "/create",
  upload.single("file"),
  // passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const file = req.file;
      const assignmentData = req.body;

      if (!file) {
        return res.status(400).send("No file uploaded.");
      }

      console.log("Creating a new assignment with data:", req.body);
      const response = await axios.post(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments`,
        req.body
      );
      console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);

      // Upload the file to the S3 bucket
      // console.log('Uploading notebook to S3');
      // const key = `${assignmentData.appname}/notebooks/${Date.now()}-notebook.ipynb`;
      // console.log('S3 key:', key);
      // await s3.putObject({
      //   Bucket: COMMON_BUCKET,
      //   Key: key,
      //   Body: file.buffer,
      //   ContentType: 'application/json'
      // }).promise();

      // call upload api to upload the file to S3
      console.log("Uploading file to:", `${DEPLOY_API_URL}/${assignmentData.appname}/upload`);
      const uploadResponse = await axios.post(`${DEPLOY_API_URL}/${assignmentData.appname}/upload`, {
        "appName": assignmentData.appname,
        "notebookName": file.originalname,
        "fileContentBase64": file.buffer.toString('base64'),
      });
      console.log('Response from DEPLOY_API_URL:', uploadResponse.data);

      // Deploy a new Battlesnake API
      console.log('Deploying a new Battlesnake API');
      console.log("DEPLOY_API_URL:", DEPLOY_API_URL, assignmentData.appname);
      const deployResponse = await axios.post(`${DEPLOY_API_URL}/deploy`, {
        "appName": assignmentData.appname
      });
      console.log('Response from DEPLOY_API_URL:', deployResponse.data);

      res.status(response.status).json(response.data);
    } catch (error) {
      console.error("Error creating assignment:", error.message);
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  }
);

// This endpoint is for instructors to get details of a specific assignment
intructorRouter.get("/details/:id", async (req, res) => {
  try {
    const assignmentId = req.params.id;
    console.log("Fetching details for assignmentId:", assignmentId);
    const response = await axios.get(
      `${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`
    );

    console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error fetching assignment details:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// This endpoint is for instructors to get a list of assignments they have created
intructorRouter.get(
  "/list/:id",
  // passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // if (req.isAuthenticated()) {
    try {
      const instructorId = req.params.id;
      console.log("Fetching assignments for instructorId:", instructorId);
      // const instructorId = req.user.userid; // Assuming req.user contains the authenticated user
      const response = await axios.get(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments/instructor/${instructorId}`
      );
      console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
    // } else {
    //   return res.status(401).json({ error: "Not authenticated" });
    // }
  }
);

// This endpoint is for instructors to update an assignment
intructorRouter.put(
  "/update/:id",
  // passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const assignmentId = req.params.id;

      const response = await axios.put(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`,
        req.body
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  }
);

// This endpoint is for instructors to delete an assignment
intructorRouter.delete(
  "/delete/:id",
  // passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const response = await axios.delete(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  }
);

module.exports = intructorRouter;
