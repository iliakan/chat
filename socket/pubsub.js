var mubsub = require('mubsub');
var config = require('nconf');
var log = require('lib/log')(module);

var pubsub = mubsub(config.get('mongoose:uri'), config.get('mongoose:options'));

/* Die on error
pubsub.on('error', function(error) {
  log.error(error);
});
*/

module.exports = pubsub;
