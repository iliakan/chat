var nconf = require('nconf');

nconf.argv()
  .env()
  .file({ file: __dirname + '/settings.json' });

if (process.env.NODE_ENV == "test") {
  nconf.set('mongoose:uri', nconf.get('mongoose:uri') + "-test");
}

if (process.env.NODE_ENV == 'development') {
  nconf.set('mongoose:options:debug', true);
}

module.exports = nconf;