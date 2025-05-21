const auth = require("express").Router();
const passport = require("passport");
const axios = require("axios");

const express = require("express");

const bodyParser = require("body-parser");

auth.use(express.json());
auth.use(bodyParser.urlencoded({ extended: true }));

const AUTH_URL = process.env.AUTH_URL || "http://localhost:8080";

auth.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/login/failed",
    keepSessionInfo: true,
  }),
  async (req, res) => {
    console.log("Google callback endpoint hit");
    if (req.user) {
      console.log(`${process.env.DB_USER_SERVICE_URL}instructor/register-user`);
      axios
        .post(`${process.env.DB_USER_SERVICE_URL}instructor/register-user`, {
          user: req.user,
        })
        .then((response) => {
          req.user.userId = response.data.user.userid;
          console.log("User ID:", response.data.user.userid);
          req.user.role = "instructor";
          console.log("User registration response:", response.data);
          req.login(req.user, (err) => {
            if (err) {
              console.error("Login error:", err);
              return res.status(500).send("Login failed");
            }
            return res.redirect(process.env.LOGIN_REDIRECT_URL);
          });
        })
        .catch((error) => {
          console.error("Error registering user:", error.message);
          res.status(500).json({ error: true, message: "User login failed" });
        });
    } else {
      res.status(403).json({ error: true, message: "Not Authorized" });
    }
  }
);

auth.get("/current_user", (req, res) => {
  console.log("Current user endpoint hit");
  console.log("Request user:", req.user);
  if (req.isAuthenticated()) {
    console.log("Authenticated user:", req.user);
    res.json(req.user);
  } else {
    console.log("User not authenticated");
    res.status(401).json({ error: "Not authenticated" });
  }
});

// router.get("/google/login", (req, res) => {
// if (req.user) {
//   console.log(`${process.env.DB_USER_SERVICE_URL}instructor/register-user`);
//   axios
//     .post(`${process.env.DB_USER_SERVICE_URL}instructor/register-user`, {
//       user: req.user,
//     })
//     .then((response) => {
//       req.user.userId = response.data.user.userid;
//       console.log("User ID:", response.data.user.userid);
//       req.user.role = "instructor";
//       console.log("User registration response:", response.data);
//       res.redirect(process.env.LOGIN_REDIRECT_URL);
//     })
//     .catch((error) => {
//       console.error("Error registering user:", error.message);
//       res.status(500).json({ error: true, message: "User login failed" });
//     });
// } else {
//   res.status(403).json({ error: true, message: "Not Authorized" });
// }
// });

auth.get("/login/failed", (req, res) => {
  res.status(401).json({
    error: true,
    message: "Log in failure",
  });
});

auth.get("/google", passport.authenticate("google", ["profile", "email"]));

auth.post(
  "/student/login",
  passport.authenticate("student-auth", { keepSessionInfo: true }),
  (req, res) => {
    console.log("Student login endpoint hit");

    if (req.user) {
      console.log("Authenticated user:", req.user);
      console.log("Processing student login...");

      // Optional: augment user object (doesn't affect session unless you reserialize)
      req.user.userId = req.user.assignmentid;
      req.user.role = "student";

      req.logIn(req.user, function (err) {
        if (err) return next(err);

        console.log("is authenticated?: " + req.isAuthenticated());

        return res.status(200).json({
          success: true,
          message: "Successful Login",
          user: req.user,
        });
      });
    } else {
      console.log("Authentication failed");
      res.status(401).json({ error: true, message: "Authentication failed" });
    }
  }
);

auth.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect(process.env.LOGIN_REDIRECT_URL);
  });
});

module.exports = auth;
