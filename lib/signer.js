var crypto = require('crypto');

exports.Signer = Signer;

function Signer(secret) {
  this.secret = secret;
}

Signer.prototype.sign = function(stringOrBuffer) {

  return stringOrBuffer + '.' +

    crypto
      .createHmac('sha256', this.secret)
      .update(stringOrBuffer)
      .digest('base64')
      .replace(/\=+$/, '');
}

Signer.prototype.unsign = function(value) {
  var str = value.slice(0, value.lastIndexOf('.'));
  return this.sign(str) == value ? str : false;
};
