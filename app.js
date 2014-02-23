// External modules
var express = require('express');
var logfmt  = require('logfmt');
var mongo   = require('mongodb');
var ejs     = require('ejs');

// Native Node modules
var path    = require('path');

var app = express();

// Uses logfmt for the console log
app.use(logfmt.requestLogger());

// Sets up /public as a static directory serving files at /assets
app.use('/assets', express.static(path.join(__dirname + '/public')));

// Sets up /views as a views directory
app.set('views', path.join(__dirname, '/views'));

// Sets up EJS as the template engine for html files
app.engine('html', ejs.renderFile);

app.get('/', function(req,res) {
  res.render('index.html');
});

var port = process.env.PORT || 5000;

app.listen(port, function() {
  console.log('Listening on ' + port);
});