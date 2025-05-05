const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const app = express();
const prisma = new PrismaClient();

const port = process.env.NODE_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function encryptPassword(password) {
  if (!password) {
    return null;
  }

  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}

//function to conver req.body to assignment
async function convertToAssignment(req) {
  const {
    campid,
    programid,
    studentname,
    snakegameid,
    appname,
    qrcodenumber,
    description,
    assignmenturl,
    password,
    instructorid
  } = req.body;

  const hashPassword = await encryptPassword(req.body.password);

    return {
      campid: parseInt(campid),
      programid: parseInt(programid),
      studentname: studentname,
      snakegameid: snakegameid,
      appname: appname,
      qrcodenumber: parseInt(qrcodenumber),
      description: description,
      // originalfile: originalfile,
      // editablefile: editablefile,
      assignmenturl: assignmenturl,
      passwordhash: hashPassword,
      instructorid: parseInt(instructorid),
    };
  }

// Create Assignment
app.post("/assignments", async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const assignment = await convertToAssignment(req);
    const newAssignment = await prisma.assignments.create({
      data: assignment,
    });
  
    console.log("Assignment created successfully:", newAssignment);

    res.json({
      message: "Assignment created successfully",
      assignment: newAssignment,
    });
  } catch (err) {
    console.error("Error creating assignment:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get Assignments by InstructorID
app.get("/assignments/instructor/:instructorId", async (req, res) => {
  try {
    const { instructorId } = req.params;
    console.log("InstructorID:", instructorId);
    const assignments = await prisma.assignments.findMany({
      where: { instructorid: parseInt(instructorId) },
    });

    if (assignments.length === 0) {
      return res
        .status(404)
        .json({ message: "No assignments found for this instructor" });
    }

    res.json(assignments);
  } catch (err) {
    console.error("Error fetching assignments:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Read Assignment
app.get("/assignments/:id", async (req, res) => {
  try {
    const assignment = await prisma.assignments.findUnique({
      where: { assignmentid: parseInt(req.params.id) },
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json(assignment);
  } catch (err) {
    console.error("Error fetching assignment:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update Assignment
app.put("/assignments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await convertToAssignment(req);

    const updatedAssignment = await prisma.assignments.update({
      where: { assignmentid: parseInt(id) },
      data: assignment,
    });

    res.json({
      message: "Assignment updated successfully",
      assignment: updatedAssignment,
    });
  } catch (err) {
    console.error("Error updating assignment:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete Assignment
app.delete("/assignments/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.assignments.delete({
      where: { assignmentid: parseInt(id) },
    });

    res.json({ message: "Assignment deleted successfully" });
  } catch (err) {
    console.error("Error deleting assignment:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
