const studentRouter = require("express").Router();
const passport = require("passport");
const axios = require("axios");
const bcrypt = require("bcrypt");
require("dotenv").config();
const DB_ASSIGNMENT_SERVICE_URL = process.env.DB_ASSIGNMENT_SERVICE_URL;
const DEPLOY_API_URL = process.env.DEPLOY_API_URL || "http://localhost:3600";

studentRouter.post("/save", async (req, res) => {
    //get the app name and code and save the latest jupyter file in s3 bucket
    const { appName, code } = req.body;

    const notebook = {
      cells: [
        {
          cell_type: "code",
          execution_count: null,
          metadata: {
            language: "python"
          },
          outputs: [],
          source: code.split('\n').map(line => line + '\n')
        }
      ],
      metadata: {
        kernelspec: {
          display_name: "Python 3",
          language: "python",
          name: "python3"
        },
        language_info: {
          name: "python",
          version: "3.x"
        }
      },
      nbformat: 4,
      nbformat_minor: 5
    };

    // Convert the notebook object to a JSON string and then to base64
    const jsonString = JSON.stringify(notebook, null, 2);
    const base64 = Buffer.from(jsonString, 'utf-8').toString('base64');

    const notebookName = `${Date.now()}-notebook.ipynb`;
    console.log("DEPLOY_API_URL:", DEPLOY_API_URL);
    await fetch(`${DEPLOY_API_URL}/${appName}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookName: notebookName, fileContentBase64: base64 })
    })
        .then((response) => {
            if (!response.ok) throw new Error("Failed to save notebook");
            return response.json();
        })
        .then((data) => {
            console.log("Notebook saved successfully:", data);
            res.status(200).json(data);
        })
        .catch((error) => {
            console.error("Error saving notebook:", error.message);
            res.status(500).json({ error: error.message });
        });
});

studentRouter.post("/deploy", (req, res) => {

});

studentRouter.get("/assignment/:qrnum", (req, res) => {
  const qrnum = req.params.qrnum;
  console.log("Fetching details for qr number:", qrnum);
  axios
    .get(`${DB_ASSIGNMENT_SERVICE_URL}/assignments/qr/${qrnum}`)
    .then((response) => {
      console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);
      res.status(response.status).json(response.data);
    })
    .catch((error) => {
      console.error("Error fetching assignment details:", error.message);
      res.status(error.response?.status || 500).json({ error: error.message });
    });
});

studentRouter.post("/verify", async (req, res) => {
  try {
    const qrNumber = req.body.qrNumber;
    const password = req.body.password;
    console.log("Received request to verify assignment.");
    console.log("Request body:", req.body);
    console.log(
      "Accessing assignment with QR Number:",
      qrNumber,
      "and password:",
      password
    );

    console.log(`Fetching from URL: ${DB_ASSIGNMENT_SERVICE_URL}/assignments/${qrNumber}`);
    const response = await axios.get(
      `${DB_ASSIGNMENT_SERVICE_URL}/assignments/qr/${qrNumber}`
    );

    console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);
    console.log("Password provided:", password);
    console.log("Password hash from database:", response.data.passwordhash);

    const isPasswordValid = await bcrypt.compare(
      password,
      response.data.passwordhash 
    );

    console.log("Password validation result:", isPasswordValid);

    if (!isPasswordValid || !response.data) {
      console.log("Invalid id or password.");
      return res.status(401).json({ error: "Invalid id and password" });
    }

    console.log("Verification successful. Sending response.");
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error fetching assignment details:", error.message);
    console.error("Error details:", error);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// post restart from deployment service /appname/restart endpoint
studentRouter.post("/restart", async (req, res) => {
  const { appName } = req.body;
  console.log("Received request to restart app:", appName);
  try {
    const response = await axios.post(`${DEPLOY_API_URL}/${appName}/restart`);
    console.log("Restart response:", response.data);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error restarting app:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

module.exports = studentRouter;
