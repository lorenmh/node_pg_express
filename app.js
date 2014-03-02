// External modules
var express = require('express');
var logfmt  = require('logfmt');
var mongo   = require('mongodb');
var ejs     = require('ejs');
var pg      = require("pg");

// Native Node modules
var path = require('path');

// App modules
var contactForm = require('./app_modules/contactform');

var app = express();

// Uses logfmt for the console log
app.use(logfmt.requestLogger());

// Sets up /public as a static directory serving files at /assets
app.use('/assets', express.static(path.join(__dirname + '/public')));

// Use express's JSON for object serialization / JSON parsing
app.use(express.json());

// Sets up /views as a views directory
app.set('views', path.join(__dirname, '/views'));

// Sets up EJS as the template engine for html files
app.engine('html', ejs.renderFile);

// Sets up the Postgres client via contactForm
var dbUri = "postgres://node_pg:1234@localhost:5432/node_pg";
var client = initPgClient(dbUri);

//Initializes the contacts table
contactForm.initTable(client);

app.get('/', function(req, res) {
  res.render('index.html');
});

app.post('/contact', function(req, res) {
  validateContactAndRespond(req, res);
});

var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log('Listening on ' + port);
});

function validateContactAndRespond(req, res) {
  contactForm.validate(req.body, function(errors) {
    // if errors is empty, then there are no errors, complete request
    if (Object.keys(errors).length === 0) {
      contactForm.insert(client, req.body, function(error) {
        if (error) {
          res.json(500, {"error":"Internal Server Error (insertion)"});
          return console.error("Row Insertion Error", error);
        } else {
          res.json(200, {ok: true});
        }
      });
    } else { 
      // respond with errors
      res.json(400, {error: errors});
    }
  });
}

function initPgClient(dbUri) {
  var newClient = new pg.Client(dbUri);
  newClient.connect(function(error) {
    if (error) {
      return console.error("connection error", error);
    }
  });

  return newClient;
};