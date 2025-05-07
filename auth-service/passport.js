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
      // console.log("Google Strategy invoked");
      // console.log("Access Token:", accessToken);
      // console.log("Refresh Token:", refreshToken);
      // console.log("Profile:", profile);
      callback(null, { ...profile, role: "instructor" });
    }
  )
);

passport.use(
  "student-auth",
  new CustomStrategy(async (req, done) => {
    const { qrNumber, password } = req.body;

    console.log("Custom strategy invoked");
    console.log("Received qrNumber:", qrNumber);
    console.log("Received password:", password);

    try {
      console.log("Sending request to external auth service...");
      const response = await axios.post(
        `${process.env.ASSIGNMENT_SERVICE_URL}/student/verify`,
        {
          qrNumber,
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
  console.log("Serializing user:", user);
  // done(null, user);
  done(null, {
    userId: user.qrcodenumber || user.userId,
    displayName: user.studentname || user.displayName,
    role: user.role,
    // emails: user.emails || "none",
  });
});

passport.deserializeUser((user, done) => {
  console.log("Deserializing user:", user);
  try {
    done(null, user);
  } catch (err) {
    console.error("Error during deserialization:", err);
    done(err);
  }
});
