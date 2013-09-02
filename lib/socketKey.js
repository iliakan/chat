var crypto = require('crypto');
var Signer = require('./signer').Signer;
var config = require('config');
var log = require('lib/log')(module);
var error = require('error').HttpError;
var async = require('async');

var SocketKey = require('models/socketKey').SocketKey;

var signer = new Signer(config.get('session:secret'));

exports.middleware = function(sessionStore) {
  return function(req, res, next) {
    if (req.url != '/socketKey') {
      return next();
    }

    async.waterfall([
      function(callback) {
        crypto.randomBytes(16, callback);
      },
      function(buffer, callback) {
        var socketKey = buffer.toString('hex');
        SocketKey.update({ // overwrite if socketKey exists for this session (never used?)
          $or: [
            {socketKey: socketKey},
            {sessionId: req.session.id}
          ]
        }, {
          socketKey: socketKey,
          sessionId: req.session.id
        }, {
          upsert: true
        }, function(err) {
          if (err) return callback(err);
          callback(null, socketKey);
        });
      }
    ], function(err, socketKey) {
      log.debug("socketKey: ", err || socketKey);
      if (err) return next(err);
      res.send(signer.sign(socketKey));
    });
  };
};

exports.retrieveSidBySocketKey = function(sessionStore, socketKey, callback) {

  var socketKey = signer.unsign(socketKey);

  if (!socketKey) {
    return callback(new HttpError(401, "Invalid socketKey"));
  }

  async.waterfall([
    function(callback) {
      SocketKey.findOne({socketKey: socketKey}, callback);
    },
    function(socketKey, callback) {
      if (!socketKey) return callback(new HttpError(401, "No such socketKey"));
      socketKey.remove(function(err) {
        if (err) return callback(err);
        callback(null, socketKey.get('sessionId'));
      });
    }
  ], callback);

};

