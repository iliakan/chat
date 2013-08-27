var sockjs = require('sockjs');
var Connection = require('./connection');

module.exports = function(sessionConfig) {

  var server = sockjs.createServer({sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"});

  server.on('connection', function(connection) {
    connection = new Connection(connection, sessionConfig);

    connection.on('message', function(message) {
      console.log(message);
    });
  });

  return server;
};

