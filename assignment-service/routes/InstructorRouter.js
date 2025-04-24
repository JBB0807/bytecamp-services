const intructorRouter = require("express").Router();
const passport = require("passport");
const axios = require("axios");

intructorRouter.post("/create", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const response = await axios.post(`${process.env.DB_ASSIGNMENT_SERVICE_URL}/assignments`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

intructorRouter.get("/list", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const instructorId = req.user.id; // Assuming req.user contains the authenticated user
    const response = await axios.get(`${process.env.DB_ASSIGNMENT_SERVICE_URL}/assignments/instructor/${instructorId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

intructorRouter.put("/update/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const response = await axios.put(`${process.env.DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

intructorRouter.delete("/delete/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const response = await axios.delete(`${process.env.DB_ASSIGNMENT_SERVICE_URL}/assignments/${assignmentId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

module.exports = intructorRouter;