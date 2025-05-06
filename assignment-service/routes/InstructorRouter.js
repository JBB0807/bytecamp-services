const intructorRouter = require("express").Router();
const passport = require("passport");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const DB_ASSIGNMENT_SERVICE_URL =
  process.env.DB_ASSIGNMENT_SERVICE_URL || "http://localhost:3000";

const DEPLOY_API_URL = process.env.DEPLOY_API_URL || "http://localhost:3600";

console.log("DB_ASSIGNMENT_SERVICE_URL:", DB_ASSIGNMENT_SERVICE_URL);
console.log("DEPLOY_API_URL:", DEPLOY_API_URL);

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
      // console.log("Fetching assignments for instructorId:", instructorId);
      const response = await axios.get(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments/instructor/${instructorId}`
      );
      // console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);
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
  upload.none(), // No file upload for this endpoint
  // passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const assignmentId = req.params.id;
      console.log("Updating assignment with ID:", assignmentId);
      console.log("Request body:", req.body);

      const response = await axios.put(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`,
        req.body
      );

      console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error("Error updating assignment:", error.message);
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

//get assignment by appname
intructorRouter.get(
  "/checkAssignmentByAppName/:appName",
  // passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const appName = req.params.appName;
      console.log("Fetching assignment for appName:", appName);
      const response = await axios.get(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments/appname/${appName}`
      );
      console.log("Response data:", response.data);
      res.status(response.status).json({"exists": (response.data !== null && response.data !== undefined)});
    } catch (error) {
      console.error("Error fetching assignment by app name:", error.message);
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  }
);

//get assignment by qrcode number
intructorRouter.get(
  "/checkAssignmentByQRCode/:qrcode",
  // passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const qrcode = req.params.qrcode;
      console.log("Fetching assignment for qrcode:", qrcode);
      const response = await axios.get(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments/${qrcode}`
      );
      console.log("Response data:", response.data);
      res.status(response.status).json({"exists": (response.data !== null && response.data !== undefined)});
    } catch (error) {
      console.error("Error fetching assignment by QR code:", error.message);
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  }
);

module.exports = intructorRouter;
