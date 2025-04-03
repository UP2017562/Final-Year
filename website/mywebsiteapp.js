const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('home', {title: 'welcome to handlebars'});
});

app.listen(port, () => {
    console.log('Server running at http://localhost:${PORT}');
});