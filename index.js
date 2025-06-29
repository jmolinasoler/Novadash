const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (for CSS)
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---
const mainRoutes = require('./routes/index');
app.use('/', mainRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Novadashboard running at http://localhost:${port}`);
});