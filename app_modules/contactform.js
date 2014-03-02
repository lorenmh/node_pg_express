/** CONTACT FORM! **/

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

exports.validate = function(data, callback) {
  var errors = {};

  var messageError = messageFieldError(data.message);
  var nameError = nameFieldError(data.name);
  var emailError = emailFieldError(data.email);

  if (messageError) {
    errors["message"] = messageError;
  }

  if (nameError) {
    errors["name"] = nameError;
  }

  if (emailError) {
    errors["email"] = emailError;
  }

  callback(errors);
}

// for some reason this isn't working as an immediate function, so fuck

exports.insert = function(client, data, callback) {
  var insertString = 
    "INSERT INTO contact(name, email, message) VALUES($1,$2,$3)";
  var insertArray = [data.name, data.email, data.message];

  client.query(insertString, insertArray, function(error) {
    callback(error);
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