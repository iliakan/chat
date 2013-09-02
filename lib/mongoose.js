var mongoose = require('mongoose');
var log = require('lib/log')(module);
var config = require('nconf');

// Установим соединение с базой
mongoose.connect(config.get('mongoose:uri'), config.get('mongoose:options'));

log.info("DB initialized");

module.exports = mongoose;