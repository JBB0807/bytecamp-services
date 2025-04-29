const router = require("express").Router();
const passport = require("passport");
const axios = require("axios");

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/auth/google/login",
    failureRedirect: "/auth/login/failed",
  })
);

router.get("/current_user", (req, res) => {
  if (req.isAuthenticated()) {
    console.log("Authenticated user:", req.user);
    res.json(req.user);
  } else {
    console.log("User not authenticated");
    res.status(401).json({ error: "Not authenticated" });
  }
});

router.get("/google/login", (req, res) => {
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
        res.redirect(process.env.LOGIN_REDIRECT_URL);
      })
      .catch((error) => {
        console.error("Error registering user:", error.message);
        res.status(500).json({ error: true, message: "User login failed" });
      });
  } else {
    res.status(403).json({ error: true, message: "Not Authorized" });
  }
});

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    error: true,
    message: "Log in failure",
  });
});

router.get("/google", passport.authenticate("google", ["profile", "email"]));

router.get("/logout", (req, res) => {
  req.logOut();
  res.redirect(process.env.LOGIN_REDIRECT_URL);
});

module.exports = router;
