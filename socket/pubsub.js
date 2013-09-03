var mubsub = require('mubsub');
var config = require('nconf');
var log = require('lib/log')(module);

var pubsub = mubsub(config.get('mongoose:uri'));

pubsub.on('error', function(error) {
  log.error(error);
});

module.exports = pubsub;
