// Import required modules
const express = require('express'); // Web framework for Node.js
const { engine } = require('express-handlebars'); // Template engine for rendering views
const bodyParser = require('body-parser'); // Middleware for parsing request bodies
const handlebarsHelpers = require('handlebars-helpers')(); // Additional helpers for Handlebars
const fetch = require('node-fetch'); // Module for making HTTP requests

const session = require('express-session'); // Middleware for managing user sessions
const sqlite3 = require('sqlite3'); // SQLite database module
const connectSqlite3 = require('connect-sqlite3'); // SQLite session store for express-session

// Initialize the Express application
const app = express();
const PORT = 8080; // Define the port the server will listen on

// Configure Handlebars as the template engine
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views'); // Set the directory for view templates
app.use(express.static('public')); // Serve static files from the 'public' directory

// Configure body-parser middleware
app.use(bodyParser.urlencoded({ extended: false })); // Parse URL-encoded data
app.use(bodyParser.json()); // Parse JSON data

//-----------------
// SESSION
//-----------------

// Configure SQLite as the session store
const SQLiteStore = connectSqlite3(session);

app.use(session({
    store: new SQLiteStore({ db: "session-db.db" }), // Use SQLite database for session storage
    saveUninitialized: false, // Do not save uninitialized sessions
    resave: false, // Do not resave sessions if they haven't been modified
    secret: "This123Is@Another#456GreatSecret678%Sentence" // Secret key for signing the session ID
}));

//------------------
// DATABASE CREATION
//------------------

// Initialize SQLite database for user data
const db = new sqlite3.Database('users-up2017562.db');

// Create 'users' table if it doesn't exist
db.run("CREATE TABLE users (user_id INTEGER PRIMARY KEY, username TEXT NOT NULL, password TEXT NOT NULL)", (error) => {
    if (error) {
        console.log("ERROR: ", error); // Log error if table creation fails
    } else {
        console.log("---> Tables users created!");

        // Insert default user into the 'users' table
        const users = [
            { "id": "1", "username": "cameron_alex", "password": "12345" },
        ];

        users.forEach((oneUser) => {
            db.run("INSERT INTO users (user_id, username, password) VALUES (?, ?, ?)", [oneUser.id, oneUser.username, oneUser.password], (error) => {
                if (error) {
                    console.log("ERROR: ", error); // Log error if insertion fails
                } else {
                    console.log("Line added into the Users Table!");
                }
            });
        });
    }
});

// Create 'preferences' table if it doesn't exist
db.run("CREATE TABLE preferences (pref_id INTEGER PRIMARY KEY, pref_uid INTEGER, font_style TEXT, font_size INTEGER, font_colour TEXT, images_to_text INTEGER, colour_contrast INTEGER, FOREIGN KEY (pref_uid) REFERENCES users (user_id))", (error) => {
    if (error) {
        console.log("ERROR: ", error); // Log error if table creation fails
    } else {
        console.log("---> Tables preference created!");

        // Insert default preferences into the 'preferences' table
        const preferences = [
            { "id": "1", "uid": "1", "style": "arial-sans", "size": "30", "colour": "black", "imtotxt": 0, "contrast": 0 },
        ];

        preferences.forEach((onePreference) => {
            db.run("INSERT INTO preferences (pref_id, pref_uid, font_style, font_size, font_colour, images_to_text, colour_contrast) VALUES (?, ?, ?, ?, ?, ?, ?)", [onePreference.id, onePreference.uid, onePreference.style, onePreference.size, onePreference.colour, onePreference.imtotxt, onePreference.contrast], (error) => {
                if (error) {
                    console.log("ERROR: ", error); // Log error if insertion fails
                } else {
                    console.log("Line added into the Preferences Table!");
                }
            });
        });
    }
});

//-----------------
// HOME PAGE
//-----------------

// Route for the home page
app.get('/', (req, res) => {
    const model = {
        style: "mystyle.css", // CSS file for styling
        isLoggedIn: req.session.isLoggedIn // Check if the user is logged in
    };
    res.render('index.handlebars', model); // Render the home page with the model
});

// Middleware to check if the user is logged in
function requireLogin(req, res, next) {
    if (!req.session.isLoggedIn) {
        return res.status(401).send('Unauthorized: Please log in to access this feature.'); // Send unauthorized response if not logged in
    }
    next(); // Proceed to the next middleware or route handler
}

// Route to handle form submission and fetch the source code of a URL
app.post('/go', requireLogin, async (req, res) => {
    const url = req.body.url; // Extract the URL from the form submission
    const userId = req.session.userId; // Get the logged-in user's ID

    console.log('Received URL:', url); // Log the URL for debugging

    try {
        // Fetch the source code of the provided URL
        const response = await fetch(url);
        const html = await response.text();

        // Fetch user preferences from the database
        db.get("SELECT * FROM preferences WHERE pref_uid = ?", [userId], (error, userPreferences) => {
            if (error || !userPreferences) {
                console.error("Error fetching preferences or no preferences found: ", error);
                return res.status(500).send('Failed to fetch user preferences.');
            }

            // Send the HTML source and preferences back to the client
            res.json({ html, preferences: userPreferences });
        });
    } catch (error) {
        console.error('Error fetching URL:', error); // Log error if fetching fails
        res.status(500).send('Failed to fetch the URL. Please check if the URL is valid.');
    }
});

//--------------------
// ACCESSIBILITY PAGE
//--------------------

// Route for the accessibility settings page
app.get('/accessibility', function (req, res) {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login'); // Redirect to login if not logged in
    }

    const userId = req.session.userId; // Get the logged-in user's ID

    // Fetch user preferences from the database
    db.get("SELECT * FROM preferences WHERE pref_uid = ?", [userId], function (error, userPreferences) {
        if (error) {
            const model = {
                style: "accessibility.css", // CSS file for styling
                hasDatabaseError: true, // Indicate a database error
                theError: error, // Pass the error message
                preferences: null, // No preferences available
                isLoggedIn: req.session.isLoggedIn // Check if the user is logged in
            };
            res.render("accessibility.handlebars", model); // Render the accessibility page with the model
        } else {
            const model = {
                style: "accessibility.css", // CSS file for styling
                hasDatabaseError: false, // No database error
                theError: "", // No error message
                preferences: userPreferences, // Pass the user preferences
                isLoggedIn: req.session.isLoggedIn // Check if the user is logged in
            };
            res.render("accessibility.handlebars", model); // Render the accessibility page with the model
        }
    });
});

// Route to save updated accessibility preferences
app.post('/save-accessibility/:prefId', (req, res) => {
    const prefId = req.params.prefId; // Get the preference ID from the URL
    const { font_style, font_size, font_colour, images_to_text, colour_contrast } = req.body;

    // Convert checkbox values to integers (SQLite uses 0/1 for boolean-like values)
    const imagesToText = images_to_text ? 1 : 0;
    const colourContrast = colour_contrast ? 1 : 0;

    // Update the preferences in the database
    db.run(
        `UPDATE preferences 
         SET font_style = ?, font_size = ?, font_colour = ?, images_to_text = ?, colour_contrast = ? 
         WHERE pref_id = ?`,
        [font_style, font_size, font_colour, imagesToText, colourContrast, prefId],
        function (error) {
            if (error) {
                console.error("Error updating preferences: ", error); // Log error if update fails
                return res.redirect('/accessibility'); // Redirect back to the page on error
            }

            console.log("Preferences updated successfully for pref_id:", prefId);
            res.redirect('/accessibility'); // Redirect back to the accessibility page
        }
    );
});

//--------------------
// LOGIN PAGE
//--------------------

// Route for the login page
app.get('/login', (req, res) => {
    const model = {
        style: "login.css", // CSS file for styling
        isLoggedIn: req.session.isLoggedIn // Check if the user is logged in
    };
    res.render('login.handlebars', model); // Render the login page with the model
});

// Route to handle login form submission
app.post('/login', (req, res) => {
    const un = req.body.un; // Extract username from the form
    const pw = req.body.pw; // Extract password from the form

    // Check if the user exists in the database
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [un, pw], (error, row) => {
        if (error) {
            console.error("Database error: ", error); // Log error if query fails
            res.redirect('/login'); // Redirect back to login page
        } else if (row) {
            console.log("User Logged in: ", un);
            req.session.isLoggedIn = true; // Mark the session as logged in
            req.session.userId = row.user_id; // Store userId in session

            res.redirect('/'); // Redirect to the home page
        } else {
            console.log('Bad user and/or bad password');
            req.session.isLoggedIn = false; // Mark the session as not logged in
            res.redirect('/login'); // Redirect back to login page
        }
    });
});

//--------------------
// REGISTER PAGE
//--------------------

// Route for the registration page
app.get('/register', (req, res) => {
    const model = {
        style: "register.css", // CSS file for styling
        isLoggedIn: req.session.isLoggedIn // Check if the user is logged in
    };
    res.render('register.handlebars', model); // Render the registration page with the model
});

// Route to handle registration form submission
app.post('/register', (req, res) => {
    const { username, password } = req.body; // Extract username and password from the form

    // Insert the new user into the 'users' table
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function (error) {
        if (error) {
            console.error("Database error: ", error); // Log error if insertion fails
            return res.redirect('/register'); // Redirect back to registration page
        }

        const userId = this.lastID; // Get the ID of the newly inserted user

        // Insert default preferences for the new user
        db.run("INSERT INTO preferences (pref_uid, font_style, font_size, font_colour, images_to_text, colour_contrast) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, "arial-sans", 30, "Black", 0, 0], (error) => {
                if (error) {
                    console.error("Error inserting default preferences: ", error); // Log error if insertion fails
                }
                res.redirect('/login'); // Redirect to the login page
            });
    });
});

//--------------------
// LOGOUT PAGE
//--------------------

// Route to handle user logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        console.log("Error while destroying the session: ", err); // Log error if session destruction fails
    });
    console.log("Logged out...");
    res.redirect('/'); // Redirect to the home page
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});