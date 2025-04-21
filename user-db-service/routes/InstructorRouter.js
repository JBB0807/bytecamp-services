const express = require("express");
const instructorRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// For new users sign-up via Google oAuth:
instructorRouter.post("/register-user", async (req, res) => {
  try {
    console.log("Received request to register user");

    const { id, displayName, emails } = req.body.user;
    console.log("User details from request:", { id, displayName, emails });

    const email = emails[0].value;
    console.log("Extracted email:", email);

    // Check if user exists
    const user = await prisma.users.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });
    console.log("User lookup result:", user);

    // if it is a new user, insert it into the DB
    if (!user) {
      console.log("User does not exist, creating new user");
      const newUser = await prisma.users.create({
        data: {
          name: displayName,
          email: email,
          role: "instructor",
          googleid: id,
          logintype: "google",
        },
      });
      console.log("New user created:", newUser);

      res.json({ message: "User added successfully", user: newUser });
    } else {
      console.log("User already exists:", user);
      res.json({ message: "User exist", user: user });
    }
  } catch (err) {
    console.error("Error during user registration:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = instructorRouter;
