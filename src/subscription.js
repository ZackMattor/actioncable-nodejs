class Subscription {
  constructor(options, cable, callbacks) {
    this.options = options;
    this.name = options.channel;
    this.callbacks = callbacks;
    this.cable = cable;

    this.cable.connection_promise.then((con) => {
      console.log(`ActionCable - connecting to ${JSON.stringify(options)}`);

      con.send(JSON.stringify({
        command: 'subscribe',
        identifier: JSON.stringify(options)
      }));
    });
  }

  handle_message(type, data) {
    if(type) {
      switch(type) {
        case 'confirm_subscription':
          this.callbacks.connected();
          break;
        case 'reject_subscription':
          this.callbacks.rejected();
          break;
        default:
          console.log(`Subscription(${this.name}) - Unhandled message type ${type} | ${data}`);
          break;
      }
    } else {
      this.callbacks.received(data);
    }
  }

  perform(action, data) {
    this.send({
      action: action,
      data: data
    });
  }

  send(data) {
    this.cable.connection_promise.then((con) => {
      if(con.readyState == 1) {
        con.send(this._create_packet(data));
      } else {
        console.log('connection is not open');
      }
    });
  }

  _create_packet(data) {
    let packet = {
      identifier: JSON.stringify(this.options),
      command: "message",
      data: JSON.stringify(data)
    };

    return JSON.stringify(packet);
  }
};

module.exports = Subscription;
