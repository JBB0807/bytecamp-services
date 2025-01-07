const express = require('express');
const path = require('path');
// use dotenv
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;



// Serve static files like CSS and JS
// be careful with the path since we don't have auth
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/html', express.static(path.join(__dirname, 'html')));

// Root route
app.get('/', (req, res) => {
    // Send the index.html file, which features lazy loading
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

//verify jwt token or gateway signature

// Lazy-loaded content endpoint
app.get('/content', (req, res) => {
    // Send the lazy-loaded content but server render it as html, perhaps use a template engine if needed
    res.send('<h1>Welcome to the lazy-loaded content!</h1><p>This content was loaded dynamically.</p>');
});

// Login route, is this redundant? might be cuz we have a login.html file
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'login.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Directory structure suggestion:
// - static/
//   - styles.css
// - html/
//   - index.html
//   - login.html
// - app.js

// static/styles.css content:
// #loader {
//     font-size: 1.5em;
//     text-align: center;
//     margin-top: 20%;
//     color: #555;
// }
// #content {
//     font-family: Arial, sans-serif;
//     margin: 20px;
//     text-align: center;
// }
