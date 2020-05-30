// Stock Market Portfolio App by Kshitiz Kumar

const express = require('express');
const path = require('path');
const exphbs  = require('express-handlebars');
const request = require('request');
const bodyParser = require('body-parser');
const async = require('async');

const PORT = process.env.PORT || 5000;

// API KEY pk_6cad451b2ea543e4aa1b534419d7489f


// use body-parser middleware
const app = express();
app.use(bodyParser.urlencoded({extended:false}));


// setting epress-handlebars Middleware
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Set Handlebars Index GET route
app.get('/',  (req, res) => {
        console.log('Get / called');
        res.render('welcome',{
    });

});


// Set Handlebars Index POST route
app.post('/',  (req, res) => {
    // Stocky will store the API response of getting stock details API
    var stocky=null;
    // comp will store the API response of getting company details API
    var comp = null;

    // Making an async parallel call for the two APIs - get stocks' details and get company details
    async.parallel({ 
        one: function(callback) { 
              console.log('Calling get company details API');
              request('https://cloud.iexapis.com/stable/stock/'+req.body.stock_ticker+'/company?token=pk_6cad451b2ea543e4aa1b534419d7489f',
                         function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                            callback(null, body);
                    } 
                    else {
                        // setting error as true
                        callback(true, {});
                    }
      });
              
        },
        two: function(callback) { 
                console.log('Calling get company stock quote details API');
                request('https://cloud.iexapis.com/stable/stock/'+req.body.stock_ticker+'/quote?token=pk_6cad451b2ea543e4aa1b534419d7489f',
                    function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            callback(null, body);
                        } 
                        else {
                            // setting error as true
                            callback(true, {});
                        }
                });
            },
       
        }, 
        // optional callback
        function(err, results) {
          // 'results' is now equal to: {one: 1, two: 2, ..., something_else: some_value}
          if(err){
              console.log("Error occured while calling APIs: "+err);
              renderErrorPage();
              return;
          }
          
          // if error has not occured
          comp = results.one;
          stocky = results.two;
          renderPage();
         
        }
      );

      // function to render an error page when error occured due to given symbol not found
      function renderErrorPage(){
            console.log("renderErrorPage Method called");
            console.log('stocky: '+stocky);
            console.log('comp: '+comp);
            // render notfound view and return
            res.render('notfound');
            return;
      }

      // function to render page with results of both APIs when no error has occured
      function renderPage(){
            console.log("renderPage Method called");
            console.log('stocky: '+stocky);
            console.log('comp: '+comp);

            // Convert JSON String to JSON objects
            const stockDetails = JSON.parse(stocky);
            const companyDetails = JSON.parse(comp);
        
            // render home view with response from two APIs and return 
            res.render('home',{
                stock : stockDetails,
                company : companyDetails
            });
        return;
      }
});


app.get('/about.html', function (req, res) {
    res.render('about');
});

// setting static folders
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log("Server Listening on Port: "+PORT));







