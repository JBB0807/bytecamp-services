const intructorRouter = require("express").Router();
const passport = require("passport");
const axios = require("axios");

const DB_ASSIGNMENT_SERVICE_URL = process.env.DB_ASSIGNMENT_SERVICE_URL || "http://localhost:3000";
console.log("DB_ASSIGNMENT_SERVICE_URL:", DB_ASSIGNMENT_SERVICE_URL);

// This endpoint is for instructors to create a new assignment
intructorRouter.post("/create", 
  // passport.authenticate("jwt", { session: false }), 
  async (req, res) => {
  try {
    console.log("Creating a new assignment with data:", req.body);
    const response = await axios.post(`${DB_ASSIGNMENT_SERVICE_URL}/assignments`, req.body);
    console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error creating assignment:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// This endpoint is for instructors to get details of a specific assignment
intructorRouter.get("/details/:id", async (req, res) => {
  try {
    const assignmentId = req.params.id;
    console.log("Fetching details for assignmentId:", assignmentId);
    const response = await axios.get(`${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`);
    console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error fetching assignment details:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// This endpoint is for instructors to get a list of assignments they have created
intructorRouter.get("/list/:id", async (req, res) => {
  // if (req.isAuthenticated()) {
    try {
      const instructorId = req.params.id;
      console.log("Fetching assignments for instructorId:", instructorId);
      // const instructorId = req.user.userid; // Assuming req.user contains the authenticated user
      const response = await axios.get(`${DB_ASSIGNMENT_SERVICE_URL}/assignments/instructor/${instructorId}`);
      console.log("Response from DB_ASSIGNMENT_SERVICE_URL:", response.data);
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  // } else {
  //   return res.status(401).json({ error: "Not authenticated" });
  // }
  
});

// This endpoint is for instructors to update an assignment
intructorRouter.put("/update/:id", 
  // passport.authenticate("jwt", { session: false }), 
  async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const response = await axios.put(`${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// This endpoint is for instructors to delete an assignment
intructorRouter.delete("/delete/:id", 
  // passport.authenticate("jwt", { session: false }), 
  async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const response = await axios.delete(`${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

module.exports = intructorRouter;