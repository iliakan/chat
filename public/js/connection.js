
function Connection() {

  this.connection = new SockJS('/socket');

  this.status = this.HANDSHAKE;

  this.connection.onopen = this.onOpen.bind(this);
  this.connection.onmessage = this.onMessage.bind(this); // function(e) {print('[.] message', e.data);};
  this.connection.onclose = this.onClose.bind(this);//function(event)  {print('[*] close ' + JSON.stringify(event));};

}
jQuery.extend(Connection.prototype, $.eventEmitter);

['HANDSHAKE', 'OPEN', 'CLOSED'].forEach(function(status) {
  Connection.prototype[status] = status;
});

Connection.prototype.onOpen = function() {

  var sid = $.cookie('sid');

  this.connection.send(JSON.stringify({
    type: 'handshake',
    sid: sid
  }));

};

Connection.prototype.onMessage = function(e) {

  var message = JSON.parse(e.data);

  if (this.status == this.HANDSHAKE) {
    if (message.type == 'handshake') {
      this.status = this.OPEN;
      this.emit('open');
    } else {
      throw new Error("First response must be handshake: " + e.data);
    }
    return;
  }

  this.emit('message', message);
};

Connection.prototype.onClose = function(event) {
  var wasStatus = this.status;
  this.status = this.CLOSED;
  if (wasStatus == this.HANDSHAKE) {
    this.emit('close', event);
  }
};

Connection.prototype.send = function(message) {
  this.connection.send(JSON.stringify(message));
};
