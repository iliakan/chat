var winston = require('winston');

module.exports = makeLogger;

var logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      level: 'debug'
    })
  ]
});

function makeLogger(module) {
  // can be much more flexible than that O_o
  return logger;
}
