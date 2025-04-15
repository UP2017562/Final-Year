const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const handlebarsHelpers = require('handlebars-helpers')();

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
            { "id":"1", "uid":"1", "style":"arial-sans", "size":"9", "colour":"White", "imtotxt":1, "contrast":0 },
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
    res.render('home.handlebars', model)
});

// Fake page route
app.get('/fake-page', (req, res) => {
    const model = {
        style: "fakepage.css",
        isLoggedIn: req.session.isLoggedIn
    };
    res.render('fake.handlebars', model);
});

// Process URL and render fake page
app.post('/go', (req, res) => {
    const model = {
        style: "mystyle.css",
        showFakePage: true, // Indicate that the fake page should load
    };
    res.render('home.handlebars', model);
});

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

app.post('/save-accessibility', (req, res) => {
    const { highContrast, fontSize, colorTheme, textSpacing, keyboardNavigation } = req.body;

    // Process the settings (e.g., save to database or apply on page reload)
    console.log('Accessibility Settings:', { highContrast, fontSize, colorTheme, textSpacing, keyboardNavigation });

    // Redirect or render confirmation
    res.redirect('/accessibility');
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