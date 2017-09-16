import * as events from 'events';

export = Connection;

declare class Connection extends events {
    constructor();

    _clientCallbacks: object;

    start(sockjs, options: object) : void;

    authenticate(connection_id: any, user: any): boolean;

    onConnect(client: any): void;

    onClose(client: any): void;

    bundle(bundle: object, id: number): void;

    getConnection(user_id: number): object|null;

    send(type: string, data: object, id: number): boolean;

    broadcastTo(type: string, data: object, list: number[]): void;

    broadcast(type: string, data: object): void;

    addClientCallback(client_id: any, callback: Function): void;
}