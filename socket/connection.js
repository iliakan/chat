var async = require('async');
var util = require('util');
var log = require('lib/log')(module);
var express = require('express');
var config = require('config');
var connect = require('connect');
var User = require('models/user').User;
var HttpError = require('error').HttpError;
var EventEmitter = require('events').EventEmitter;
var assert = require('assert');
var socketKey = require('lib/socketKey');
var Router = require('./router');


function Connection(connection, sessionConfig) {
  this.sessionConfig = sessionConfig;
  this.connection = connection;

  this.router = new Router(this);
  this._setStatus(this.CONNECTING);

  connection.on('data', this.onData.bind(this));
  connection.on('close', this.onClose.bind(this));
}

util.inherits(Connection, EventEmitter);

['CONNECTING', 'OPEN', 'CLOSED'].forEach(function(status) {
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

  if (this.status == this.CONNECTING) {
    this.onHandshake(message);
  } else if (this.status == this.OPEN) {
    this.onMessage(message);
  }

};

Connection.prototype.close = function(status, message) {
  this.connection.close(status, message);
};

Connection.prototype.onClose = function() {
  if (this.status != this.CONNECTING) {
    this.emit('close');
  }
  this._setStatus(this.CLOSED);
};


Connection.prototype.onHandshake = function(message) {
  var self = this;

  if (message.type != 'handshake') {
    this.close(401, "First message must be a handshake");
    return;
  }

  if (!message.socketKey) {
    this.close(401, "First message must contain socketKey");
    return;
  }

  async.waterfall([
    function(callback) {
      socketKey.retrieveSidBySocketKey(self.sessionConfig.store, message.socketKey, callback);
    },
    function(sid, callback) {
      self.loadSessionUser(sid, callback);
    }
  ], function(err) {
    if (err) {
      log.error(err);
      return self.closeOnError(err);
    }
    self._setStatus(self.OPEN);
    log.info("auth complete");
    self.send({
      type: 'handshake'
    });
    self.emit('open');

  });

};

Connection.prototype.send = function(message) {
  this.connection.write(JSON.stringify(message));
};

Connection.prototype.closeOnError = function(err) {
  if (err instanceof HttpError) {
    this.close(err.status, err.message);
  } else {
    log.error("closeOnError", err);
    this.close();
  }
};

Connection.prototype.loadSessionUser = function(sid, callback) {

  var self = this;

  async.waterfall([
    function(callback) {
      // express calls are not quite compatible with async here!
      // I get 0 arguments if no session
      // I get 1 argument (error) if error
      // I get 2 arguments (null, session) if ok
      self.sessionConfig.store.load(sid, function(err, session) {
        if (err === undefined) {
          // no arguments => no session
          return callback(new HttpError(401, "Session not found"));
        }
        if (err && !session) {
          // 1 argument => error
          return callback(err);
        }
        if (session) {
          self.session = session;
          return callback();
        }
        callback(new Error("Must never get here"));
      });
    },
    function(callback) {
      if (self.session.user) {
        log.debug("retrieving user ", self.session.user);
        User.findById(self.session.user, function(err, user) {
          if (err) return callback(err);
          log.debug("user findbyId result: " + user);
          self.user = user;
          callback();
        });
      } else {
        callback();
      }
    }
  ], callback);
};

Connection.prototype.onMessage = function(message) {
  var self = this;

  async.waterfall([
    function(callback) {
      self.loadSessionUser(self.session.id, callback);
    },
    function(session, user, callback) {
      self.router.route(message);
    }
  ], function(err) {
    if (err) {
      log.error(err);
      return self.closeOnError(err);
    }
  });
};


Connection.prototype._setStatus = function(status) {
  log.debug("status: ", status);
  this.status = status;
};

exports.Connection = Connection;