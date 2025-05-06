const studentRouter = require("express").Router();
const passport = require("passport");
const axios = require("axios");
const bcrypt = require("bcrypt");
require("dotenv").config();
const DB_ASSIGNMENT_SERVICE_URL = process.env.DB_ASSIGNMENT_SERVICE_URL;


studentRouter.post("/save", (req, res) => {});

studentRouter.post("/deploy", (req, res) => {});

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

module.exports = studentRouter;
