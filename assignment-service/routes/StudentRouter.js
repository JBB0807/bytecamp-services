const studentRouter = require("express").Router();
const passport = require("passport");
const axios = require("axios");
const bcrypt = require("bcrypt");
require("dotenv").config();
const DB_ASSIGNMENT_SERVICE_URL = process.env.DB_ASSIGNMENT_SERVICE_URL;


studentRouter.post("/save", (req, res) => {});

studentRouter.post("/deploy", (req, res) => {});

studentRouter.post("/verify/", async (req, res) => {
  try {
    const assignmentId = req.body.id;
    const password = req.body.password;
    console.log(
      "Accessing assignment with ID:",
      assignmentId,
      "and password:",
      password
    );

    console.log(`Fetching from URL: ${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`);
    const response = await axios.get(
      `${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`
    );

    console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);
    console.log("Password provided:", password);
    console.log("Password hash from database:", response.data.passwordhash);

    const isPasswordValid = await bcrypt.compare(
      password,
      response.data.passwordhash
    );

    if (!isPasswordValid || !response.data) {
      return res.status(401).json({ error: "Invalid id and password" });
    }

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error fetching assignment details:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

module.exports = studentRouter;
