// Stock Market Portfolio App by Kshitiz Kumar

const express = require('express');
const app = express();
const path = require('path');
const exphbs  = require('express-handlebars');
const reqest = require('request');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000;

// API KEY pk_6cad451b2ea543e4aa1b534419d7489f


// use body-parser middleware
app.use(bodyParser.urlencoded({extended:false}));

function call_stock_api(doneCallingAPI,ticker) {
    console.log(ticker);
    if(ticker==undefined){ ticker='goog'};
    reqest('https://cloud.iexapis.com/stable/stock/'+ticker+'/quote?token=pk_6cad451b2ea543e4aa1b534419d7489f', 
        { json : true },
        (err, res, body) => {
            if(err) { return console.log(err);}
            if(res.statusCode === 200){
                doneCallingAPI(body);
            };
    });
}

// function call_company_api(doneCallingCompany) {
//     reqest('https://cloud.iexapis.com/stable/stock/fb/company?token=pk_6cad451b2ea543e4aa1b534419d7489f', 
//         { json : true },
//         (err, res, body) => {
//             if(err) { return console.log(err);}
//             if(res.statusCode === 200){
//                 doneCallingCompany(body);
//             };
//     });
// }


// setting epress-handlebars Middleware
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Set Handlebars Index GET route
app.get('/',  (req, res) => {
    call_stock_api( (doneCallingAPI) => {
        res.render('welcome',{
            
        });
    });

});

// Set Handlebars Index POST route
app.post('/',  (req, res) => {
    call_stock_api( (doneCallingAPI) => {
        posted_stuff = req.body.stock_ticker
        res.render('home',{
            stock : doneCallingAPI,
            posted_stuff : posted_stuff
        });
    },req.body.stock_ticker);

});


app.get('/about.html', function (req, res) {
    res.render('about');
});

// setting static folders
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log("Server Listening on Port: "+PORT));