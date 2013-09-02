var mongoose = require('lib/mongoose');
var Schema = mongoose.Schema;

var config = require('config');

var schema = new Schema({
  socketKey: {
    type: String,
    unique: true,
    required: true
  },
  sessionId: {
    type: String,
    unique: true,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: config.get('socketKey:maxAge')
  }
});

exports.SocketKey = mongoose.model('SocketKey', schema);
