function Connection(options) {
  this.options = options || {};

  this.reconnectAttempt = 0;
  this.connect();
}

jQuery.extend(Connection.prototype, $.eventEmitter);

['CONNECTING', 'OPEN', 'CLOSED'].forEach(function(status) {
  Connection.prototype[status] = status;
});

Connection.prototype.RECONNECT_DELAYS = [1000, 2500, 5000, 10000, 30000, 60000];

Connection.prototype.connect = function() {
  this.socket = new SockJS(this.options.prefix, undefined, this.options.socket);
  this.status = this.CONNECTING;

  this.socket.onopen = this.onOpen.bind(this);
  this.socket.onmessage = this.onMessage.bind(this);
  this.socket.onclose = this.onClose.bind(this);
}

Connection.prototype.onOpen = function() {
  var self = this;

  this.reconnectAttempt = 0;

  if (this.options.debug) {
    console.log("socket open");
  }

  $.ajax({
    method: 'POST',
    url: '/socketKey',
    success: function(socketKey) {
      self.socket.send(JSON.stringify({
        type: 'handshake',
        socketKey: socketKey
      }));
    }
  });

};

Connection.prototype.onMessage = function(e) {

  var message = JSON.parse(e.data);

  if (this.options.debug) {
    console.log("message:", message);
  }

  if (this.status == this.CONNECTING) {
    if (message.type == 'handshake') {
      if (this.options.debug) {
        console.log("handshake received");
      }

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
  var self = this;

  if (this.options.debug) {
    console.log("close", event);
  }

  if (event.code == 401) {
    // logged out
    this.status = this.CLOSED;
    this.emit('close', event);
    return;
  }

  if (this.status == this.OPEN) {
    this.emit('disconnect');
  }

  this.status = this.CONNECTING;

  var delay = this.RECONNECT_DELAYS[this.reconnectAttempt]
  || this.RECONNECT_DELAYS[this.RECONNECT_DELAYS.length-1];

  if (this.options.debug) {
    console.log("Reconnect in " + delay);
  }

  setTimeout(function() {
    self.reconnectAttempt++;
    self.connect();
  }, delay);

};

Connection.prototype.send = function(message) {
  if (this.status != this.OPEN) {
    throw new Error("Connection is not open");
  }
  this.socket.send(JSON.stringify(message));
};
