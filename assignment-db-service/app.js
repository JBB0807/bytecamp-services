const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const app = express();
const prisma = new PrismaClient();

const port = process.env.NODE_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create Assignment
app.post('/assignments', async (req, res) => {
  try {
    const {
      CampID,
      ProgramID,
      StudentName,
      SnakeGameId,
      OriginalFile,
      EditableFile,
      AssignmentUrl,
      Password,
      InstructorID,
    } = req.body;

    const hashedPassword = await bcrypt.hash(Password, 10);

    const newAssignment = await prisma.assignment.create({
      data: {
        CampID,
        ProgramID,
        StudentName,
        SnakeGameId,
        OriginalFile,
        EditableFile,
        AssignmentUrl,
        PasswordHash: hashedPassword,
        InstructorID,
      },
    });

    res.json({ message: 'Assignment created successfully', assignment: newAssignment });
  } catch (err) {
    console.error('Error creating assignment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get Assignments by InstructorID
app.get('/assignments/instructor/:instructorId', async (req, res) => {
  try {
    const { instructorId } = req.params;

    const assignments = await prisma.assignment.findMany({
      where: { InstructorID: parseInt(instructorId) },
    });

    if (assignments.length === 0) {
      return res.status(404).json({ message: 'No assignments found for this instructor' });
    }

    res.json(assignments);
  } catch (err) {
    console.error('Error fetching assignments:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Read Assignment
app.get('/assignments/:id', async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { AssignmentID: parseInt(req.params.id) },
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (err) {
    console.error('Error fetching assignment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update Assignment
app.put('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.Password) {
      data.PasswordHash = await bcrypt.hash(data.Password, 10);
      delete data.Password;
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { AssignmentID: parseInt(id) },
      data,
    });

    res.json({ message: 'Assignment updated successfully', assignment: updatedAssignment });
  } catch (err) {
    console.error('Error updating assignment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete Assignment
app.delete('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.assignment.delete({
      where: { AssignmentID: parseInt(id) },
    });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error('Error deleting assignment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
