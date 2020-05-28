// Stock Market Portfolio App by Kshitiz Kumar

const express = require('express');
const app = express();
const path = require('path');
const exphbs  = require('express-handlebars');

const PORT = process.env.PORT || 5000;

// setting epress-handlebars Middleware
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Set Handlebars routes
app.get('/', function (req, res) {
    res.render('home',{
        stuff : "This is stuff"
    });
});

// setting static folders
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log("Server Listening on Port: "+PORT));