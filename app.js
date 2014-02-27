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
  handlePostRequest(req, res);
});

var handlePostRequest = function(req, res) {
  var body = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    body += chunk;
  })
  req.on('end', function() {
    validate(req, res, JSON.parse(body));
  })
};

var validate = function(req, res, data) {
  var errors = {};
  var hasError = false;
  
  var messageError = messageFieldError(data.message);
  var nameError = nameFieldError(data.name);
  var emailError = emailFieldError(data.email);

  if (messageError) {
    errors["message"] = messageError;
    hasError = true;
  }
  if (nameError) {
    errors["name"] = nameError;
    hasError = true;
  }
  if (emailError) {
    errors["email"] = emailError;
    hasError = true;
  }
  if (!hasError) {
    insertContactAndRespond(res, data)
  } else {
    sendFailure(res, errors);
  }
}

var sendFailure = function(res, errors) {
  res.json(400, {error: errors});
};

// role = node_pg, password = 1234, ... database = node_pg
var dbUri = "postgres://node_pg:1234@localhost:5432/node_pg";

var client = new pg.Client(dbUri);

client.connect(function(error) {
  if (error) {
    return console.error("connection error", error);
  }
})

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

var insertContactAndRespond = function(res, data) {
  var insertString = 
    "INSERT INTO contact(name, email, message) VALUES($1,$2,$3)";
  var insertArray = [data.name, data.email, data.message];

  client.query(insertString, insertArray, function(error) {
    if (error) {
      return console.error("row insert error", error);
      res.json(500, {error:"Internal Server Error (insertion)"});
    }

    res.json({ok: true});
    client.end();
  });
}

var emailFieldError = function(string) {
  if (string.length == 0) {
    return "Please enter your email address.";
  } else {
    var at = string.indexOf('@');
    var period = string.indexOf('.');
    if (at > 0) {
      if (period > at + 1 && period < string.length - 1) {
        return false;
      }
    }
    return "Please enter a valid email address.";
  }
}

// Could use /^([A-z]|\s)+$/ to include only letters and spaces,
// but I am going to just return true for the time being (Umlauts? Accents? etc)
var nameFieldError = function(string) {
  if (string.length == 0) {
    return "Please enter your name.";
  } else {
    return false;
  }
}

var messageFieldError = function(string) {
  if (string.length == 0) {
    return "Please enter your project details.";
  } else {
    return false;
  }
}