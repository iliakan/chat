var mongoose = require('mongoose');
var log = require('lib/log')(module);
var config = require('nconf');

// Установим соединение с базой
mongoose.connect(config.get('mongoose:uri'), config.get('mongoose:options'));

mongoose.connection.on('connected', function() {
  log.info('connected');
});

/* die on error
mongoose.connection.on('error', function(err)  {
  console.error("Mongoose error", err);
});
*/

log.info("DB initialized");

module.exports = mongoose;