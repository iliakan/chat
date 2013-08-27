var util = require('util');
var HTTPStatus = require('http-status');

// ошибки для выдачи посетителю
function HttpError(status, message) {
  Error.apply(this, arguments);
  Error.captureStackTrace(this, arguments.callee);

  this.status = status;
  this.message = message || HTTPStatus[status] || "Error";
}
util.inherits(HttpError, Error);
module.exports = HttpError;
HttpError.prototype.name = 'HttpError';



