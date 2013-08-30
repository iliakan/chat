// http://www.slideshare.net/domenicdenicola/domains-20010482
//
var HttpError = require('error').HttpError;
var http = require('http');
var path = require('path');
var log = require('log')(module);

var nconf = require('config');

// Создадим "приложение" express
var express = require('express');
var app = express();

// Установим соединение с базой
var mongoose = require('db');

// Базовые настройки
app.engine('ejs', require('ejs-locals'));
app.set('views', __dirname + '/template');
app.set('view engine', 'ejs');

// Встроенные Middleware
app.use(express.favicon());
if (app.get('env') == 'development') {
  app.use(express.logger('dev'));
}
app.use(express.bodyParser());
app.use(express.cookieParser());

// Хранилище сессий в MongoDB
var MongoStore = require('connect-mongo')(express);

// Будем использовать одно соединение с Mongoose для сессий
var sessionConfig = {
  secret: nconf.get('session:secret'), // подпись для куков с сессией
  cookie: {
    path: "/",
    maxAge: 4*3600*1000, // 4h max inactivity for session
    httpOnly: false // expose for sockets
  },
  key: "sid",
  store: new MongoStore({mongoose_connection: mongoose.connection})
};

app.use(require('middleware/resExtensions'));

// потеряет домен из-за работы с базой данных
app.use(express.session(sessionConfig));

app.use(require('middleware/loadUser'));

app.use(require('middleware/resLocals'));

// Конфигурируем стандартные запросы
require('./routes')(app);

app.use(express.static(path.join(__dirname, 'public')));

// Обработка HttpError
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


// 1. Echo sockjs server
var socketServer = require('socket')(sessionConfig);

var server = app.server = http.createServer(app);

socketServer.installHandlers(server, {prefix:'/socket'});


server.listen(nconf.get('port'), function() {
  log.info("Express server listening on port " + nconf.get('port'));
});

module.exports = app;