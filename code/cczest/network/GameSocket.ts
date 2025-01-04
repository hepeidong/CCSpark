import { cc_zest_socket_protocol, IResponseSocketData, ISocketClient } from "zest";
import { utils } from "../utils";

/**
 * author: 何沛东
 * date: 2021/7/25
 * name: 游戏socket父类
 * description: 游戏中的各个平台网络连接的父类
 */
export abstract class GameSocket<T> implements ISocketClient {
    protected _protocolType: cc_zest_socket_protocol;
    protected _readyState: number;
    protected _url: string;
    protected _socket: T;

    private _name: string;

    private static _instance: GameSocket<any> = null;

    public static readonly CLOSED: number     = 3;
    public static readonly CLOSING: number    = 2;
    public static readonly CONNECTING: number = 0;
    public static readonly OPEN: number       = 1;
    constructor(name?: string) {
        GameSocket._instance = this;
        this._readyState = -1;
        this._url  = "";
        this._name = name;
    }

    public get protocolType() { return this._protocolType; }
    public get readyState(): number { return this._readyState; }
    public get url(): string { return this._url; }

    public static getSocket(): GameSocket<any> {
        return this._instance;
    }

    public description() {}

    public abstract connect(url: string): Promise<void>;

    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView | ArrayBuffer) {}

    public close(code?: number, reason?: string) {}

    public onOpen(callback: () => void) {}
    public onMessage(callback: (data: IResponseSocketData) => void) {}
    public onClose(callback: (res: {code: number; reason: string;}) => void) {}
    public onError(callback: () => void) {}

    public toString() {
        return utils.StringUtil.replace('[Socket:{0}]', this._name);
    }
}