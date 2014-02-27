/** CONTACT FORM! **/
var pg = require("pg");

exports.initClient = function(dbUri) {
  var client = new pg.Client(dbUri);
  client.connect(function(error) {
    if (error) {
      return console.error("connection error", error);
    }
  });

  return client;
};

exports.initTable = function(client) {
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
      console.error("Table Initialization Error", error);
    } else {
      console.log("contact Table Initialized");
    }
  });
}

exports.handlePostRequest = function(req, res, client) {
  var body = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    body += chunk;
  })
  req.on('end', function() {
    validate(req, res, client, JSON.parse(body));
  })
};

function validate(req, res, client, data) {
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
    insertContactAndRespond(res, client, data)
  } else {
    sendFailure(res, errors);
  }
}

function sendFailure(res, errors) {
  res.json(400, {error: errors});
};

// for some reason this isn't working as an immediate function, so fuck

function insertContactAndRespond(res, data, client) {
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

function emailFieldError(string) {
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
function nameFieldError(string) {
  if (string.length == 0) {
    return "Please enter your name.";
  } else {
    return false;
  }
}

function messageFieldError(string) {
  if (string.length == 0) {
    return "Please enter your project details.";
  } else {
    return false;
  }
}