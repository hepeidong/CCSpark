import { IHttpManager, ISocketManager, ITimeManager } from "../lib.ccspark";
import { CCHttp } from "./Http";
import { CCHttpMessage } from "./HttpMessage";
import { CCSocket } from "./Socket";
import { ProtocolType } from "./SocketEnum";
import { CCSocketMessage } from "./SocketMessage";
import TimeManager from "./TimeManager";

export class network {
    public static get http(): IHttpManager { return CCHttp.instance; }
    public static get socket(): ISocketManager { return CCSocket.instance; }
    public static get time(): ITimeManager { return TimeManager; }
}

export namespace network {
    export enum Method {
        GET = 'GET',
        POST = 'POST'
    }
    export enum Protocol {
        JSON = ProtocolType.JSON,
        ARRAY_BUFFER = ProtocolType.ARRAY_BUFFER
    }
    export class SocketMessage<Response_T, Request_T> extends CCSocketMessage<Response_T, Request_T> {}
    export class HttpMessage<Response_T, Request_T> extends CCHttpMessage<Response_T, Request_T> {}
}