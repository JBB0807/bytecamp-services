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
  console.log("Converting request body to assignment object...");
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

  console.log("Request body fields:", {
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
  });

  const hashPassword = await encryptPassword(req.body.password);

  console.log("Password hash generated:", hashPassword);

  const assignment = {
    campid: campid ? parseInt(campid) : null,
    programid: programid ? parseInt(programid) : null,
    studentname: studentname || null,
    snakegameid: snakegameid || null,
    appname: appname || null,
    qrcodenumber: qrcodenumber ? parseInt(qrcodenumber) : null,
    description: description || null,
    assignmenturl: assignmenturl || null,
    passwordhash: hashPassword || null,
    instructorid: instructorid ? parseInt(instructorid) : null,
  };

  console.log("Converted assignment object:", assignment);

  return assignment;
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
      orderBy: { assignmentid: 'asc' },
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
app.get("/assignments/:qrNumber", async (req, res) => {
  try {
    console.log("Fetching assignment with QR Code Number:", req.params.qrNumber);

    const assignment = await prisma.assignments.findMany({
      where: { qrcodenumber: parseInt(req.params.qrNumber) },
    });

    if (!assignment) {
      console.log("No assignment found for QR Code Number:", req.params.qrNumber);
      return res.status(404).json({ message: "Assignment not found" });
    }

    console.log("Assignment found:", assignment);
    res.json(assignment);
  } catch (err) {
    console.error("Error fetching assignment:", err.message);
    res.status(500).json({ error: err.message });
  }
});

//get assignment by appname
app.get("/assignments/appname/:appName", async (req, res) => {
  try {
    const { appName } = req.params;
    const assignments = await prisma.assignments.findMany({
      where: { appname: appName },
    });

    if (assignments.length === 0) {
      return res.status(404).json({ message: "No assignments found" });
    }

    res.json(assignments);
  } catch (err) {
    console.error("Error fetching assignments:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update Assignment
app.put("/assignments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await convertToAssignment(req);

    const existingAssignment = await prisma.assignments.findUnique({
      where: { assignmentid: parseInt(id) },
    });

    if (!existingAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Update only the fields that are provided in the request body
    Object.keys(assignment).forEach((key) => {
      if (assignment[key]) {
        existingAssignment[key] = assignment[key];
      }
    });

    console.log("Existing Assignment before update:", existingAssignment);

    const updatedAssignment = await prisma.assignments.update({
      where: { assignmentid: parseInt(id) },
      data: existingAssignment,
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
