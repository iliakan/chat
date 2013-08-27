var mubsub = require('mubsub');
var nconf = require('nconf');
var log = require('log')(module);
var pubsub = mubsub(nconf.get('mongoose:uri'));

pubsub.on('error', function(error) {
  log(error);
});

module.exports = pubsub;