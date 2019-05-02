const WebSocket = require('ws');
const Subscription = require('./subscription.js');

const message_types = {
  welcome: "welcome",
  ping: "ping",
  confirmation: "confirm_subscription",
  rejection: "reject_subscription"
};

class ActionCable {
  constructor(url, opts) {
    this.cable_url = url;
    this.origin = opts.origin || "http://localhost:3000";
    this.headers = opts.headers || {};
    this.connection = null;
    this.subscriptions = {};
    this.logger = opts.logger || console

    // heartbeat state
    this.last_heartbeat_timestamp = null;
    this.heartbeat_interval = null;

    this.connection_promise = this._connect();
  }

  subscribe(name_or_options, callbacks) {
    if (typeof name_or_options === "string") {
      name_or_options = {
        channel: name_or_options
      };
    }

    let name = name_or_options.channel;

    if(this.subscriptions[name]) {
      throw "Already subscribed to this channel!";
      return;
    }

    this.subscriptions[name] = new Subscription(name_or_options, this, callbacks, this.logger);
    return this.subscriptions[name];
  }

  // PRIVATE

  _connect() {
    return new Promise((resolve, reject) => {
      let connection = new WebSocket(this.cable_url, { origin: this.origin, headers: this.headers });

      connection.on('error', (err) => { this._disconnected(err) });
      connection.on('close', this._disconnected.bind(this));
      connection.on('message', this._handle_message.bind(this));
      connection.on('open', () => {
        this.heartbeat_interval = setInterval(this._check_heartbeat.bind(this), 10000)
        resolve(connection)
      });

      this.connection = connection;
    });
  }

  _handle_message(msg) {
    let data = JSON.parse(msg);

    let type = data.type;
    let message = data.message;
    let identifier = data.identifier ? JSON.parse(data.identifier) : {};

    let sub = this.subscriptions[identifier.channel]

    switch(type) {
      case message_types.welcome:
        break;
      case message_types.ping:
        this.last_heartbeat_timestamp = (+ new Date());
        break;
      case message_types.confirmation:
        sub.callbacks.connected();
        break;
      case message_types.rejection:
        sub.callbacks.rejected();
        break;
      default:
        sub.callbacks.received(message);
        break;
    }
  }

  _check_heartbeat() {
    // return if we arent connected
    if(!this.connection && !this.last_heartbeat_timestamp) return;

    let is_heartbeat_flat = (this.last_heartbeat_timestamp + 10*1000) < (+ new Date());

    if(is_heartbeat_flat) {
      this.logger.log('ActionCable -> Heartbeat has gone flat');
      this.connection.close(1012); // 1012 - restarting
    }
  }

  _disconnected(err) {
    this.logger.log("ActionCable -> socket disconnected");
    if(this.heartbeat_interval) { clearInterval(this.heartbeat_interval); this.logger.log('ActionCable -> Cleared the heartbeat interval'); }

    for(let sub in this.subscriptions) {
      this.subscriptions[sub].callbacks.disconnected(err);
      delete this.subscriptions[sub];
    }
  }
};

module.exports = ActionCable;
