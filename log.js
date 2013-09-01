var winston = require('winston');


// can be much more flexible than that O_o


function getLogger(module) {

  var path = module.filename.split('/').slice(-2).join('/');

  return new winston.Logger({
    transports: [
      new winston.transports.Console({
        colorize: true,
        level: 'debug',
        label: path
      })
    ]
  });
}

module.exports = getLogger;
