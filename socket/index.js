var sockjs = require('sockjs');
var Connection = require('./connection').Connection;
var log = require('lib/log')(module);

module.exports = function(sessionConfig) {

  var server = sockjs.createServer({
    sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js",
    log: log.log.bind(log)
  });

  server.on('connection', function(connection) {
    connection = new Connection(connection, sessionConfig);

    connection.on('message', function(message) {
      log.debug(message);
    });
  });

  return server;
};

