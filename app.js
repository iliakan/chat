var http = require('http');
var join = require('path').join;

var HttpError = require('error').HttpError;
var log = require('lib/log')(module);

var config = require('config');

// Create application
var express = require('express');
var app = express();

// Setup database
var mongoose = require('lib/mongoose');

// Basic app settings
app.engine('ejs', require('ejs-locals'));
app.set('views', join(__dirname, '/template'));
app.set('view engine', 'ejs');

// Attach middleware
app.use(express.favicon());

app.use(express.logger( config.get('logger:format') ) );

app.use(express.bodyParser());
app.use(express.cookieParser());

// MongoDB session store
var MongoStore = require('connect-mongo')(express);

// sessionConfig for express & sock.js
var sessionConfig = {
  secret: config.get('session:secret'), // подпись для куков с сессией
  cookie: {
    path: "/",
    maxAge: config.get('session:maxAge'), // 4h max inactivity for session
    httpOnly: true // hide from attackers
  },
  key: "sid",
  // take connection settings from mongoose
  store: new MongoStore({mongoose_connection: mongoose.connection})
};

app.use(require('middleware/resExtensions'));

app.use(express.session(sessionConfig));

app.use(require('lib/socketKey').middleware());

app.use(require('middleware/loadUser'));

app.use(require('middleware/resLocals'));

require('./routes')(app);

app.use(express.static(join(__dirname, 'public')));

app.use(function(err, req, res, next) {
  if (typeof err == 'number') {
    err = new HttpError(err);
  }

  if (err instanceof HttpError) {
    res.sendHttpError(err);
  } else {
    if (app.get('env') == 'development') {
      express.errorHandler()(err, req, res, next);
    } else {
      log.error(err);
      err = new HttpError(500);
      res.sendHttpError(err);
    }
  }
});


// Configure websockets
var socketServer = require('socket')(sessionConfig);

var server = app.server = http.createServer(app);

socketServer.installHandlers(server, {prefix:'/socket'});

server.listen(config.get('port'), function() {
  log.info("Express server listening on port " + config.get('port'));
});

module.exports = app;
