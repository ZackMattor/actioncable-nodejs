declare module "actioncable-nodejs" {
  import * as WebSocket from "ws";

  interface ConstructorOpts {
    headers: { [key: string]: string };
    logger: any;
  }

  interface SubscriptionOptions {
    channel: string;
    [key: string]: any;
  }

  interface SubscribeHandlers {
    connected(): void;
    disconnected(code: any): void;
    rejected(): void;
    received(data: any): void;
    [key: string]: any;
  }

  interface Subscription {
    cable: ActionCable;
  }

  class ActionCable {
    constructor(url: string, opts: ConstructorOpts);
    connection: WebSocket;
    connection_promise: Promise<WebSocket>;
    subscribe(channel: SubscriptionOptions | string, handlers: SubscribeHandlers): Subscription;
  }

  namespace ActionCable {}

  export = ActionCable;
}
