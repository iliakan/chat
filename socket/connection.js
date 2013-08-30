var async = require('async');
var util = require('util');
var log = require('log')(module);
var express = require('express');
var cookieParser = express.cookieParser();
var connect = require('connect');
var User = require('models/user');
var error = require('error').HttpError;
var EventEmitter = require('events').EventEmitter;
var assert = require('assert');

var Router = require('./router');

function Connection(connection, sessionConfig) {
  this.sessionConfig = sessionConfig;
  this.connection = connection;

  this.router = new Router(this);
  this.status = this.HANDSHAKE;

  connection.on('data', this.onData.bind(this));
  connection.on('close', this.onClose.bind(this));
}

util.inherits(Connection, EventEmitter);

['HANDSHAKE', 'OPEN', 'CLOSED'].forEach(function(status) {
  Connection.prototype[status] = status;
});

/**
 * Обработать сообщение, первое должно быть {type:handshake, sid: ... }
 * Express-сессия должна уже существовать (генерируется страницей)
 * @param message
 */
Connection.prototype.onData = function(message) {
  assert.notEqual(this.status, this.CLOSED);

  var self = this;
  try {
    message = JSON.parse(message);
  } catch (e) {
    this.close(400, "Message must be JSON");
    return;
  }

  if (this.status == this.HANDSHAKE) {
    this.onHandshake(message);
  } else if (this.status == this.OPEN) {
    this.onMessage(message);
  }

};

Connection.prototype.close = function(status, message) {
  this.connection.close(status, message);
};

Connection.prototype.onClose = function() {
  if (this.status != this.HANDSHAKE) {
    this.emit('close');
  }
  this.status = this.CLOSED;
};



Connection.prototype.onHandshake = function(message) {
  var self = this;

  if (message.type != 'handshake') {
    this.close(403, "First message must be a handshake");
    return;
  }

  if (!message.sid) {
    this.close(403, "First message must contain sid");
    return;
  }

  var sid = connect.utils.parseSignedCookie(message.sid, self.sessionConfig.secret);
  if (!sid) {
    this.close(403, "Bad sid");
  }


  this.loadSession(sid, function(err, session) {
    if (err) {
      return self.closeOnError(err);
    }

    self.sid = sid;
    self.status = self.OPEN;
    self.send({
      type: 'handshake'
    });

    self.emit('handshake');

  });

};

Connection.prototype.send = function(message) {
  this.connection.write(JSON.stringify(message));
};

Connection.prototype.closeOnError = function(err) {
  if (err instanceof HttpError) {
    this.close(err.status, err.message);
  } else {
    log.error(err);
    this.close();
  }
};

Connection.prototype.onMessage = function(message) {
  var self = this;

  async.waterfall([
    function(callback) {
      self.loadSession(self.sid, callback)
    },
    function(session, callback) {
      self.loadSessionUser(session, callback)
    },
    function(session, user, callback) {

      message.session = session;
      message.user = user;
      self.router.route(message);
      callback();
    }
  ], function(err) {
    log.error(err);
    if (err) return self.closeOnError(err);
  })
};

Connection.prototype.loadSessionUser = function(session, callback) {
  if (session.user) {
    log.debug("retrieving user ", session.user);
    User.findById(session.user, function(err, user) {
      if (err) return callback(err);

      log.debug("user findbyId result: " + user);
      return callback(null, session, user);
    });
  } else {
    return callback(null, session, null);
  }
};

Connection.prototype.loadSession = function(sid, callback) {

  var self = this;
  async.waterfall([
    function(callback) {
      self.sessionConfig.store.load(sid, callback);
    },
    function(session, callback) {
      if (!session) {
        return callback(new HttpError(403, "Session not found:" + sid));
      } else {
        return callback(null, session);
      }
    }
  ],
    callback);
};


exports.Connection = Connection;