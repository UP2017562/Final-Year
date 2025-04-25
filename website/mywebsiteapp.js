const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const handlebarsHelpers = require('handlebars-helpers')();
const fetch = require('node-fetch');

const session = require('express-session');
const sqlite3 = require('sqlite3');
const connectSqlite3 = require('connect-sqlite3');

const app = express();
const PORT = 8080;

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

//-----------------
// SESSION
//-----------------
const SQLiteStore = connectSqlite3(session);

app.use(session({
    store: new SQLiteStore({db: "session-db.db"}),
    saveUninitialized: false,
    resave: false,
    secret: "This123Is@Another#456GreatSecret678%Sentence"
}));

//------------------
//DATABASE CREATION
//------------------

const db = new sqlite3.Database('users-up2017562.db');

db.run("CREATE TABLE users (user_id INTEGER PRIMARY KEY, username TEXT NOT NULL, password TEXT NOT NULL)", (error) =>{
    if (error) {
        console.log("ERROR: ", error)
    } else {
        console.log("---> Tables users created!")

        const users = [
            { "id":"1", "username":"cameron_alex", "password":"12345"},
        ]

        users.forEach ( (oneUser) =>{
            db.run("INSERT INTO users (user_id, username, password) VALUES (?, ?, ?)", [oneUser.id, oneUser.username, oneUser.password], (error) =>{
                if (error) {
                    console.log("ERROR: ", error)
                } else {
                    console.log("Line added into the Users Table!")
                }
            })
        })
    }
});

db.run("CREATE TABLE preferences (pref_id INTEGER PRIMARY KEY, pref_uid INTEGER, font_style TEXT, font_size INTEGER, font_colour TEXT, images_to_text INTEGER, colour_contrast INTEGER, FOREIGN KEY (pref_uid) REFERENCES users (user_id))", (error) =>{
    if (error) {
        console.log("ERROR: ", error)
    } else {
        console.log("---> Tables preference created!")

        const preferences = [
            { "id":"1", "uid":"1", "style":"arial-sans", "size":"30", "colour":"black", "imtotxt":0, "contrast":0 },
        ]

        preferences.forEach ( (onePreference) =>{
            db.run("INSERT INTO preferences (pref_id, pref_uid, font_style, font_size, font_colour, images_to_text, colour_contrast) VALUES (?, ?, ?, ?, ?, ?, ?)", [onePreference.id, onePreference.uid, onePreference.style, onePreference.size, onePreference.colour, onePreference.imtotxt, onePreference.contrast], (error) =>{
                if (error) {
                    console.log("ERROR: ", error)
                } else {
                    console.log("Line added into the Preferences Table!")
                }
            })
        })
    }
});

//-----------------
// HOME PAGE
//-----------------
app.get('/', (req, res) => {
    const model={
        style: "mystyle.css",
        isLoggedIn: req.session.isLoggedIn
    }
    res.render('home-2.handlebars', model)
});

// Route to handle form submission and fetch the source code
app.post('/go', async (req, res) => {
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
        console.error('Error fetching URL:', error);
        res.status(500).send('Failed to fetch the URL. Please check if the URL is valid.');
    }
});


app.post('/fake-page', (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login'); // Redirect to login if not logged in
    }

    const userId = req.session.userId; // Get the logged-in user's ID

    db.get("SELECT * FROM preferences WHERE pref_uid = ?", [userId], (error, userPreferences) => {
        if (error || !userPreferences) {
            console.error("Error fetching preferences or no preferences found: ", error);
            return res.render('fake.handlebars', {
                layout: false,
                style: "fakepage.css",
                isLoggedIn: req.session.isLoggedIn,
                preferences: null, // Pass null if preferences are not found
            });
        }

        // Pass preferences to the view
        res.render('fake.handlebars', {
            layout: false,
            style: "fakepage.css",
            isLoggedIn: req.session.isLoggedIn,
            preferences: userPreferences, // Pass preferences to the view
        });
    });
});



// // Process URL and render fake page
// app.post('/go', (req, res) => {
//     if (!req.session.isLoggedIn) {
//         return res.redirect('/login'); // Redirect to login if not logged in
//     }

//     const userId = req.session.userId; // Get the logged-in user's ID

//     db.get("SELECT * FROM preferences WHERE pref_uid = ?", [userId], (error, userPreferences) => {
//         if (error || !userPreferences) {
//             console.error("Error fetching preferences or no preferences found: ", error);
//             return res.render('home.handlebars', {
//                 style: "mystyle.css",
//                 isLoggedIn: req.session.isLoggedIn,
//                 showFakePage: true,
//                 preferences: null, // Pass null if preferences are not found
//             });
//         }

//         // Pass preferences to the home view
//         res.render('home.handlebars', {
//             style: "mystyle.css",
//             isLoggedIn: req.session.isLoggedIn,
//             showFakePage: true,
//             preferences: userPreferences, // Pass preferences to the view
//         });
//     });
// });

//--------------------
// ACCESSIBILITY PAGE
//--------------------
app.get('/accessibility', function(req, res){
    if (!req.session.isLoggedIn) {
        return res.redirect('/login'); // Redirect to login if not logged in
    }

    const userId = req.session.userId; // Assuming userId is stored in the session upon login

    db.get("SELECT * FROM preferences WHERE pref_uid = ?", [userId], function (error, userPreferences){
        if (error) {
            const model = {
                style: "accessibility.css",
                hasDatabaseError: true,
                theError: error,
                preferences: null,
                isLoggedIn: req.session.isLoggedIn
            };
            res.render("accessibility.handlebars", model);
        } else {
            const model = {
                style: "accessibility.css",
                hasDatabaseError: false,
                theError: "",
                preferences: userPreferences,
                isLoggedIn: req.session.isLoggedIn
            };
            res.render("accessibility.handlebars", model);
        }
    });
});


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
                console.error("Error updating preferences: ", error);
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
app.get('/login', (req, res) => {
    const model={
        style: "login.css",
        isLoggedIn: req.session.isLoggedIn
    }
    res.render('login.handlebars', model)
});

app.post('/login', (req, res) => {
    const un = req.body.un;
    const pw = req.body.pw;

    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [un, pw], (error, row) => {
        if (error) {
            console.error("Database error: ", error);
            res.redirect('/login');
        } else if (row) {
            console.log("User Logged in: ", un);
            req.session.isLoggedIn = true;
            req.session.userId = row.user_id; // Store userId in session

            res.redirect('/');
        } else {
            console.log('Bad user and/or bad password');
            req.session.isLoggedIn = false;
            res.redirect('/login');
        }
    })
});

//--------------------
// REGISTER PAGE
//--------------------
app.get('/register', (req, res) => {
    const model = {
        style: "register.css",
        isLoggedIn: req.session.isLoggedIn
    };
    res.render('register.handlebars', model);
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function (error) {
        if (error) {
            console.error("Database error: ", error);
            return res.redirect('/register');
        }

        const userId = this.lastID; // Get the ID of the newly inserted user

        // Insert default preferences for the new user
        db.run("INSERT INTO preferences (pref_uid, font_style, font_size, font_colour, images_to_text, colour_contrast) VALUES (?, ?, ?, ?, ?, ?)", 
            [userId, "arial-sans", 30, "Black", 0, 0], (error) => {
                if (error) {
                    console.error("Error inserting default preferences: ", error);
                }
                res.redirect('/login');
            });
    });
});

//--------------------
// LOGOUT PAGE
//--------------------
app.get('/logout', (req, res) => {
    req.session.destroy( (err) => {
        console.log("Error while destroying the session: ", err)
    })
    console.log("Logged out...")
    res.redirect('/')
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});