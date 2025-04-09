const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

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