export = Connection;

declare class Connection {
    constructor();

    start(sockjs, options: object) : void;

    executeCallback(callback_id: any, data: object): void;

    authenticate(token: any): void;

    send(type: string, data: object, callback?: Function): void;

    disconnect(): void;

    on(event: any, cb: Function): void;

    emit(event: any): void;
}