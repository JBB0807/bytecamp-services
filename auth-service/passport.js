require('dotenv').config();

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
            scope: ["profile", "email"],
        },
        function (accessToken, refreshToken, profile, callback) {

            // Save the user info to your DB here if still not yet saved
            // Example of what profile might contain:
            // {
            //   "id": "112233445566778899",
            //   "displayName": "John Doe",
            //   "emails": [{ "value": "john.doe@gmail.com" }],
            //   "photos": [{ "value": "https://.../photo.jpg" }]
            // }

            callback(null, profile);
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null,user);
});