// Stock Market Portfolio App by Kshitiz Kumar

const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const request = require('request');
const bodyParser = require('body-parser');
const async = require('async');

const PORT = process.env.PORT || 5000;
// If you are looking this code at My Github and want to run this code on your local machine, then you should include your API Key here
const API_KEY = process.env.API_KEY;


// use body-parser middleware
const app = express();
app.use(bodyParser.urlencoded({
	extended: false
}));


// setting epress-handlebars Middleware for HTML page templating and rendering
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Set Handlebars Index GET route
app.get('/', (req, res) => {
	console.log('Get / called');
	// render welcome.handlebars page
	res.render('welcome', {});

});


// Set Handlebars Index POST '/' route
app.post('/', (req, res) => {
	// stocky will store the API response of getting stock details API
	var stocky = null;
	// comp will store the API response of getting company details API
	var comp = null;
	// logo will store response from the logo API
	var logo = null;
	// chart will store json required for HighCharts to draw the graph
	var chart = null;
	// This will store response from chart/dynamic API. It is used to make chart for current month.
	var dataThisMonth = null;
	// chart will store json required for HighCharts to draw the graph for today's trends
	var chartToday = null;
	// This will response from store today's stock data API.
	var dataToday = null;

	// Making an async parallel call for five APIs - get stocks' details, get company details, get company logo, get monthly stock data and get today's stock data, in that order.
	async.parallel({
			one: function (callback) {
				const url = 'https://cloud.iexapis.com/stable/stock/' + req.body.stock_ticker + '/company?token=' + API_KEY;
				console.log('Calling get company details API : ' + url);
				request(url,
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
							console.log("Get Company Details API (one) call SUCCESS");
							callback(null, body);
						} else {
							// setting error as true
							console.log("Get Company Details API (one) call FAILED");
							callback(true, {});
						}
					});

			},
			two: function (callback) {
				const url = 'https://cloud.iexapis.com/stable/stock/' + req.body.stock_ticker + '/quote?token=' + API_KEY;
				console.log('Calling get company stock quote details API: ' + url);
				request(url,
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
							console.log("Get Company Stock Quote API (two) call SUCCESS");
							callback(null, body);
						} else {
							// setting error as true
							console.log("Get Company Stock Quote API (two) call FAILED");
							callback(true, {});
						}
					});
			},

			three: function (callback) {
				const url = 'https://cloud.iexapis.com/stable/stock/' + req.body.stock_ticker + '/logo?token=' + API_KEY;
				console.log('Calling get company logo from logo API: ' + url);
				request(url,
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
							console.log("Get Company Logo API (three) call SUCCESS");
							callback(null, body);
						} else {
							// setting error as true
							console.log("Get Company Logo API (three) call FAILED");
							callback(true, {});
						}
					});
			},

			four: function (callback) {
				const url = 'https://cloud.iexapis.com/stable/stock/' + req.body.stock_ticker + '/chart/dynamic?token=' + API_KEY;
				console.log('Calling get stock data for this month API: ' + url);
				request(url,
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
							console.log("Get stock data for this month API (four) call SUCCESS");
							callback(null, body);
						} else {
							// setting error as true
							console.log("Get stock data for this month API (four) call FAILED");
							callback(true, {});
						}
					});
			},

			five: function (callback) {
				const url = 'https://cloud.iexapis.com/stable/stock/' + req.body.stock_ticker + '/intraday-prices?token=' + API_KEY + '&chartSimplify=true';
				console.log('Calling get stock data trend for today API: ' + url);
				request(url,
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
							console.log("Get stock data trend for today API (five) call SUCCESS");
							callback(null, body);
						} else {
							// setting error as true
							console.log("Get stock data trend for today API (five) call FAILED");
							callback(true, {});
						}
					});
			},

		},
		// callback
		function (err, results) {
			// 'results' is now equal to: {one: API 1 Response, two: API 2 Response, ..., something_else: some_value}

			// if we got an error during any asnyc call (Here only not found case is considered).
			if (err) {
				console.log("Error occured while calling APIs: " + err);
				// render the not found page for wrong exchange symbol
				renderErrorPage();
				return;
			}

			// if error has not occured
			comp = results.one;
			stocky = results.two;
			logo = results.three;
			dataThisMonth = results.four;
			dataToday = results.five;
			// Render the page - home.handlebars with the results of above 5 APIs
			renderPage();

		}
	);


	// function to render an error page when error occured due to given exchange symbol not found
	function renderErrorPage() {
		console.log('renderErrorPage Method called');
		console.log('Get stock quote API Response: ' + stocky);
		console.log('Get company details API Response: ' + comp);
		console.log('Get Company logo API Response: ' + logo);
		console.log('Get Stock Data this month API Response: ' + dataThisMonth);
		console.log('Get Stock Data today API Response: ' + dataToday);
		// render notfound.handlebars view and return
		res.render('notfound');
		return;
	}

	// function to render page with results of all 5 APIs when no error has occured
	function renderPage() {
		console.log("renderPage Method called");

		// Convert JSON Strings to JSON objects
		var stockDetails = JSON.parse(stocky); // This is intentionally kept var as we are modifying the response a little (marshalling response) before sending
		const companyDetails = JSON.parse(comp);
		const companyLogo = JSON.parse(logo);

		// Marshall Data for Response
		stockDetails = marshallResponse(stockDetails);

		// render home.handlebars view with response from all five APIs and return 
		res.render('home', {
			// left side keys will be exposed to handlebars pages.
			stock: stockDetails,
			company: companyDetails,
			logo: companyLogo,
			highChartJson: chart,
			chartForToday: chartToday
		});
		// finally return after doing all processing for POST '/' call   
		return;
	}

	// helper function to marshall the response from get stock details API
	function marshallResponse(stockDetails) {
		// formatting Closing Percentage Change
		var closingPercentChange = stockDetails.changePercent;
		stockDetails.changePercent = closingPercentChange * 100;
		// formatting YTD Change
		var ytdPercentageChange = stockDetails.ytdChange;
		stockDetails.ytdChange = ytdPercentageChange * 100;
		// Converting time in milliseconds to UTC Date
		var openTime = stockDetails.openTime;
		stockDetails.openTime = new Date(openTime).toUTCString();
		var closeTime = stockDetails.closeTime;
		stockDetails.closeTime = new Date(closeTime).toUTCString();
		var todayHighTime = stockDetails.highTime;
		stockDetails.highTime = new Date(todayHighTime).toUTCString();
		var todayLowTime = stockDetails.lowTime;
		stockDetails.lowTime = new Date(todayLowTime).toUTCString();
		var lastTrade = stockDetails.lastTradeTime;
		stockDetails.lastTradeTime = new Date(lastTrade).toUTCString();

		// To make the json which finally get supplied to highcharts to draw line chart for stock data of current month
		chart = makeHighChart(stockDetails.companyName);

		// To make the json which finally get supplied to highcharts to draw line chart for stock data trend for today
		chartToday = makeHighChartForToday(stockDetails.companyName);

		return stockDetails;

	}

	// helper function to make json for highcharts to draw graph for this month
	function makeHighChart(companyName) {

		var dataThisMonthJSON = JSON.parse(dataThisMonth);
		var dataDynamic = dataThisMonthJSON.data;
		var dataDynamicLength = Object.keys(dataDynamic).length;

		var title = {
			text: 'Stock Trends for this Month'
		};

		var subtitle = {
			text: companyName
		};

		var xAxis = {
			categories: []
		};

		var yAxis = {
			title: {
				text: 'Stock Price ($)'
			},
			plotLines: [{
				value: 0,
				width: 1,
				color: '#808080'
			}]
		};

		var tooltip = {
			valuePrefix: '$'
		}

		var credits = {
			enabled: false
		}

		var legend = {
			layout: 'vertical',
			align: 'right',
			verticalAlign: 'middle',
			borderWidth: 0
		};

		var series = [{
				name: 'Open',
				data: []
			},
			{
				name: 'Close',
				data: []
			},
			{
				name: 'High',
				data: []
			},
			{
				name: 'Low',
				data: []
			}
		];

		for (var i = 0; i < dataDynamicLength; i++) {
			xAxis.categories.push(dataDynamic[i].date);
			// Open
			series[0].data.push(dataDynamic[i].open);
			// Close
			series[1].data.push(dataDynamic[i].close);
			// High
			series[2].data.push(dataDynamic[i].high);
			// Low
			series[3].data.push(dataDynamic[i].low);
		}

		var json = {};
		json.title = title;
		json.subtitle = subtitle;
		json.xAxis = xAxis;
		json.yAxis = yAxis;
		json.credits = credits;
		json.tooltip = tooltip;
		json.legend = legend;
		json.series = series;

		// wrapping the json in an object so that it gets easier to access whole json in handlebars
		var highChartJsonWrapper = {};
		var jsonString = JSON.stringify(json);
		highChartJsonWrapper.jsonValue = jsonString;

		// finally returning the wrapped json object
		return highChartJsonWrapper;

	}

	// helper function to make json for highcharts to draw graph for stock trends for today
	function makeHighChartForToday(companyName) {
		var dataTodayJSON = JSON.parse(dataToday);
		var dataTodayLength = Object.keys(dataTodayJSON).length;

		var title = {
			text: 'Stock Trends for Today (or Last Updated Date)'
		};

		var subtitle = {
			text: companyName + '  |  ' + dataTodayJSON[0].date
		};

		var xAxis = {
			categories: []
		};

		var yAxis = {
			title: {
				text: 'Stock Price ($)'
			},
			plotLines: [{
				value: 0,
				width: 1,
				color: '#808080'
			}]
		};

		var tooltip = {
			valuePrefix: '$'
		}

		var legend = {
			layout: 'vertical',
			align: 'right',
			verticalAlign: 'middle',
			borderWidth: 0
		};

		var series = [{
				connectNulls: true,
				name: 'Open',
				data: []
			},
			{
				connectNulls: true,
				name: 'Close',
				data: []
			},
			{
				connectNulls: true,
				name: 'High',
				data: []
			},
			{
				connectNulls: true,
				name: 'Low',
				data: []
			}
		];

		var credits = {
			enabled: false
		}

		for (var i = 0; i < dataTodayLength; i++) {
			xAxis.categories.push(dataTodayJSON[i].label);
			// Open
			series[0].data.push(dataTodayJSON[i].open);
			// Close
			series[1].data.push(dataTodayJSON[i].close);
			// High
			series[2].data.push(dataTodayJSON[i].high);
			// Low
			series[3].data.push(dataTodayJSON[i].low);

		}

		var json = {};
		json.title = title;
		json.subtitle = subtitle;
		json.xAxis = xAxis;
		json.yAxis = yAxis;
		json.tooltip = tooltip;
		json.legend = legend;
		json.series = series;
		json.credits = credits;

		// wrapping the json in an object so that it gets easier to access whole json in handlebars
		var highChartJsonWrapper = {};
		var jsonString = JSON.stringify(json);
		highChartJsonWrapper.jsonValue = jsonString;

		// finally returning the wrapped json object
		return highChartJsonWrapper;
	}

}); // end of POST '/'


app.get('/about', function (req, res) {
	res.render('about');
});

// setting static folders path.
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log("Server Listening on Port: " + PORT));