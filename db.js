var mongoose = require('mongoose');
var log = require('log')(module);
var nconf = require('nconf');

// Установим соединение с базой
mongoose.connect(nconf.get('mongoose:uri'), nconf.get('mongoose:options'));

log.info("DB initialized");

module.exports = mongoose;