var pubsub = require('./pubsub');
var log = require('log')(module);

var chat = pubsub.channel('chat');

function Router(connection) {
  var self = this;

  this.connection = connection;

  this.connection.on('handshake', function() {

    var subscription = chat.subscribe('room', function(msg) {
      self.connection.send(msg);
    });

    self.connection.on('close', function() {
      subscription.unsubscribe();
    });

  });
}

Router.prototype.route = function(message) {
  var self = this;

  chat.publish('room', {
    username: message.user.get('username'),
    text: message.text
  });

  message.session.save();
};

module.exports = Router;