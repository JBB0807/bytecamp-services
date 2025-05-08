const intructorRouter = require("express").Router();
const passport = require("passport");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const DB_ASSIGNMENT_SERVICE_URL =
  process.env.DB_ASSIGNMENT_SERVICE_URL || "http://localhost:3000";

const DEPLOY_API_URL = process.env.DEPLOY_API_URL || "http://localhost:3600";
const PROXY_URL = process.env.PROXY_URL;

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

      //insert the initial assignment data into the database
      console.log("Creating a new assignment with data:", req.body);
      const dbResponse = await axios.post(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments`,
        req.body
      );

      const assignmentId = dbResponse.data.assignment.assignmentid;
      console.log("Assignment created with ID:", assignmentId);

      console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", dbResponse.data);

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

      const ipv6 = deployResponse.data.ipv6;
      console.log("Deployed Battlesnake API IPv6:", ipv6);

      // Update the assignment with the deployment details
      const updatedAssignmentData = {
        assignmenturl: `${PROXY_URL}/${ipv6}`,
      }

      console.log("Updating assignment with deployment details:", updatedAssignmentData);
      const updateRespone = await axios.put(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`,
        updatedAssignmentData
      );

      console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", updateRespone.data);

      res.status(deployResponse.status).json(deployResponse.data);
    } catch (error) {
      console.error("Error creating assignment:", error.message);
      //delete the file from s3 and the database if the assignment creation fails
      try {
        console.log("Deleting file from S3 due to error in assignment creation");
        await axios.post(`${DEPLOY_API_URL}/${req.body.appname}/delete`, {
          "appName": req.body.appname
        });

        console.log('Response from DEPLOY_API_URL:', error.response.data);
      } catch (deleteError) {
        console.error("Error deleting file from S3:", deleteError.message);
      }
      //delete the assignment from the database
      try {
        console.log("Deleting assignment from database due to error in assignment creation");
        await axios.delete(
          `${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`
        );
      } catch (deleteError) {
        console.error("Error deleting assignment from database:", deleteError.message);
      }
      //send the error response to the client
      console.error("Error response from DB_ASSIGNMENT_SERVICE_URL:", error.response.data);
      console.error("Error response status:", error.response.status);

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

      //get the assignment data from the database
      console.log("Fetching assignment data for ID:", assignmentId);
      const assignmentResponse = await axios.get(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`
      );
      const assignmentData = assignmentResponse.data;
      console.log("Assignment data:", assignmentData);

      if (!assignmentData) {
        return res.status(404).json({ error: "Assignment not found" });
      } 

      // Delete the Battlesnake API
      if(assignmentData.appname){
        console.log(`Deleting Battlesnake API: ${assignmentData.appname}`);
        const deployResponse = await axios.post(`${DEPLOY_API_URL}/${assignmentData.appname}/delete`, {
          "appName": assignmentData.appname
        });
        //throw error if the response is not 200
        console.log('Response from DEPLOY_API_URL:', deployResponse.data);
        if (deployResponse.status !== 200) {
          throw new Error(`Failed to delete Battlesnake API: ${deployResponse.statusText}`);
        }
        console.log('Response from DEPLOY_API_URL:', deployResponse.data);
      }
      
      console.log("Deleting assignment from database:", assignmentId);
      const response = await axios.delete(
        `${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`
      );
      console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);
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
