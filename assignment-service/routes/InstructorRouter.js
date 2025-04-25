const intructorRouter = require("express").Router();
const passport = require("passport");
const axios = require("axios");

const { DB_ASSIGNMENT_SERVICE_URL } = process.env.DB_ASSIGNMENT_SERVICE_URL || "http://localhost:3000";

// This endpoint is for instructors to create a new assignment
intructorRouter.post("/create", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const response = await axios.post(`${DB_ASSIGNMENT_SERVICE_URL}/assignments`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// This endpoint is for instructors to get a list of assignments they have created
intructorRouter.get("/list", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const instructorId = req.user.id; // Assuming req.user contains the authenticated user
    const response = await axios.get(`${DB_ASSIGNMENT_SERVICE_URL}/assignments/instructor/${instructorId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// This endpoint is for instructors to update an assignment
intructorRouter.put("/update/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const response = await axios.put(`${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// This endpoint is for instructors to delete an assignment
intructorRouter.delete("/delete/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const response = await axios.delete(`${DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

module.exports = intructorRouter;