const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');

const session = require('express-session');
const sqlite3 = require('sqlite3');
const connectSqlite3 = require('connect-sqlite3');
const e = require('express');

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

db.run("CREATE TABLE preferences (pref_id INTEGER PRIMARY KEY, pref_uid INTEGER, font_style TEXT, font_size INTEGER, font_colour TEXT, images_to_text BOOLEAN, colour_contrast BOOLEAN, FOREIGN KEY (pref_uid) REFERENCES users (user_id))", (error) =>{
    if (error) {
        console.log("ERROR: ", error)
    } else {
        console.log("---> Tables preference created!")

        const preferences = [
            { "id":"1", "uid":"1", "style":"arial sans", "size":"9", "colour":"White", "imtotxt":"True", "contrast":"False"},
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
        style: "mystyle.css"
    }
    res.render('home.handlebars', model)
});

// Fake page route
app.get('/fake-page', (req, res) => {
    const model = {
        style: "fakepage.css",
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
app.get('/accessibility', (req, res) => {
    const model={
        style: "accessibility.css"
    }
    res.render('accessibility.handlebars', model)
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
        style: "login.css"
    }
    res.render('login.handlebars', model)
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});