# actioncable-nodejs
ActionCable NodeJS client Implementation.


## Getting Started
`npm install actioncable-nodejs --save`

```javascript
const ActionCable = require('./actioncable/actioncable.js');

let cable_url = 'ws://localhost:3000/cable';

let cable = new ActionCable(cable_url, {
  // If you validate the origin on the server, you can set that here
  origin: 'http://localhost:3000',

  // Using headers with an API key for auth is recommended
  // because we dont have the normal browser session to authenticate with
  headers: {
    'X-Api-Key': 'someexampleheader'
  }
});

let subscription = cable.subscribe('RouterTestAgentChannel', {
  connected() {
    console.log("connected");
  },

  disconnected() {
    console.log("disconnected");
  },

  rejected() {
    console.log("rejected");
  },

  received(data) {
    console.log("received");
    console.log(data);
  }
});

// Send a message to the server
subscription.perform("command_processed", {foo: 'bar'});
```
