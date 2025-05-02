require("dotenv").config();

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const CustomStrategy = require("passport-custom").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    function (accessToken, refreshToken, profile, callback) {
      callback(null, profile);
    }
  )
);

passport.use(
  "student-auth",
  new CustomStrategy(async (req, done) => {
    const { assignment, password } = req.body;

    try {
      // Call your external auth service
      const response = await axios.post("http://localhost:8082/student/verify", {
        assignment,
        password,
      });

      if (response.data && response.data.success) {
        const user = response.data.user;
        return done(null, user); // success
      } else {
        return done(null, false, { message: "Invalid credentials" });
      }
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
