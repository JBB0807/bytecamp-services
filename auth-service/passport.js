require("dotenv").config();

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const CustomStrategy = require("passport-custom").Strategy;
const axios = require("axios");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    function (accessToken, refreshToken, profile, callback) {
      callback(null, {...profile, role: "instructor"});
    }
  )
);

passport.use(
  "student-auth",
  new CustomStrategy(async (req, done) => {
    const { assignmentId, password } = req.body;

    console.log("Custom strategy invoked");
    console.log("Received assignmentId:", assignmentId);
    console.log("Received password:", password);

    try {
      console.log("Sending request to external auth service...");
      const response = await axios.post(
        `${process.env.ASSIGNMENT_SERVICE_URL}/student/verify`,
        {
          assignmentId,
          password,
        }
      );

      if (response.status === 200 && response.data) {
        user = {
          ...response.data,
          role: "student",
        };
        console.log("Authentication successful, user:", user);
        return done(null, user); // success
      } else {
        console.log("Authentication failed: Invalid credentials");
        return done(null, false, { message: "Invalid credentials" });
      }
    } catch (err) {
      console.error("Error during authentication:", err);
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  // done(null, user);
  console.log("Serializing user:", user);
  done(null, {
    id: user.assignmentid || user.id,
    displayName: user.studentname || user.displayName,
    role: user.role,
    emails: user.emails || "none",
  });
});

passport.deserializeUser(async (user, done) => {
  try {
    console.log("Deserializing user:", user);
    done(null, user);
  } catch (err) {
    console.error("Error during deserialization:", err);
    done(err);
  }
});
