/*
 sockjs-node has some internal state - mapping from sockjs session number to an
 internal structure (consisting of, above all others outgoing message buffer).
  As node cluster is basically equivalent to fork, it doesn't share this state across
   forks and will not work with sockjs-node. Additionally, I can't see how this state
   could be shared and there doesn't seem to be any option for doing a custom routing
   (ie: forward all requests from session A to worker B).
 */


var HttpError = require('error').HttpError;
var http = require('http');
var path = require('path');
var log = require('log')(module);

var nconf = require('config');

// Create application
var express = require('express');
var app = express();

// Setup database
var mongoose = require('db');

// Basic app settings
app.engine('ejs', require('ejs-locals'));
app.set('views', __dirname + '/template');
app.set('view engine', 'ejs');

// Attach middleware
app.use(express.favicon());
if (app.get('env') == 'development') {
  app.use(express.logger('dev'));
}
app.use(express.bodyParser());
app.use(express.cookieParser());

// MongoDB session store
var MongoStore = require('connect-mongo')(express);

// sessionConfig for express & sock.js
var sessionConfig = {
  secret: nconf.get('session:secret'), // подпись для куков с сессией
  cookie: {
    path: "/",
    maxAge: nconf.get('session:maxAge'), // 4h max inactivity for session
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

app.use(express.static(path.join(__dirname, 'public')));

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


server.listen(nconf.get('port'), function() {
  log.info("Express server listening on port " + nconf.get('port'));
});

module.exports = app;
