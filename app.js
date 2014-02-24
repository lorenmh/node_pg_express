// External modules
var express = require('express');
var logfmt  = require('logfmt');
var mongo   = require('mongodb');
var ejs     = require('ejs');
var pg      = require("pg");

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

app.get('/', function(req, res) {
  res.render('index.html');
});

var port = process.env.PORT || 5000;

app.listen(port, function() {
  console.log('Listening on ' + port);
});


/** CONTACT FORM! **/
app.use(express.json());

app.post('/contact', function(req, res) {
  getDataFromRequest(req, res, validate);
});

var getDataFromRequest = function(req, res, callback) {
  var body = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    body += chunk;
  })
  req.on('end', function() {
    callback(req, res, JSON.parse(data));
  })
};

var validate = function(req, res, data) {
  var errors = [];
  if (!messageFieldValid(data.message)) {
    errors.push("message");
  }
  if (!nameFieldValid(data.name)) {
    errors.push("name");
  }
  if (!emailFieldValid(data.email)) {
    errors.push("email");
  }
  if (errors.length == 0) {
    sendSuccessAndInsert(res, data)
  } else {
    sendFailure(res, errors);
  }
}

// role = node_pg, password = 1234, ... database = node_pg
var dbUri = "postgres://node_pg:1234@localhost:5432/node_pg";

var client = new pg.Client(dbUri);

client.connect(function(error) {
  if (error) {
    return console.error("connection error", error);
  }
})

var sendSuccessAndInsert(res, data) {

}

var initTable = function(){
  var tableInitString = 
    "CREATE TABLE IF NOT EXISTS contact (" +
      "id serial primary key," +
      "name varchar(128)," +
      "email varchar(128)," +
      "message text," +
      "time timestamptz not null default now()" +
    ");";

  client.query(tableInitString, function(error) {
    if (error) {
      console.error("table init error", error);
    }
  });
};

// for some reason this isn't working as an immediate function, so fuck
initTable();

var insertContact = function(data) {
  var insertString = 
    "INSERT INTO contact(name, email, message) VALUES($1,$2,$3)";
  var insertArray = [data.name, data.email, data.message];

  client.query(insertString, insertArray, function(error) {
    if (error) {
      return console.error("row insert error", error);
    }

    client.end();
    console.log("Inserted into table, " + name + ", " + email + ".")
  });
}

var emailFieldValid = function(string) {
  var at = string.indexOf('@');
  var period = string.indexOf('.');
  if (at > 0) {
    if (period > at + 1 && period < string.length - 1) {
      return true;
    }
  }
  return false;
}

// Could use /^([A-z]|\s)+$/ to include only letters and spaces,
// but I am going to just return true for the time being (Umlauts? Accents? etc)
var nameFieldValid = function(string) {
  if (string.length > 0) {
    return true;
  } else {
    return false;
  }
}

var messageFieldValid = function(string) {
  if (string.length > 0) {
    return true;
  } else {
    return false;
  }
}