const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.static('public'));

app.get('/', (req, res) => {
    const model={
        style: "mystyle.css"
    }
    res.render('home.handlebars', model)
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});