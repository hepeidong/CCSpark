import { decorator } from "../decorator/Decorator";
import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { Assert } from "../exceptions/Assert";
import { GameSocket } from "./GameSocket";
import { cc_spark_socket_protocol } from "../lib.ccspark";

const {ccsclass} = decorator;

/**
 * author: 何沛东
 * date: 2021/7/25
 * name: 浏览器平台socket代理类
 * description: 原生socket，这个类可以用于原生平台，浏览器等等平台网络连接
 */
@ccsclass("NativeSocket")
export class NativeSocket extends GameSocket<WebSocket> {
    constructor() {
        super('NativeSocket');
    }

    public set protocolType(type: cc_spark_socket_protocol) {
        this._protocolType = type;
        Debug.log("NativeSocket binaryType", this._protocolType);
    }

    public description() {
        Debug.info(this.toString(), '启用原生webSocket');
    }

    public link(url: string) {
        return new Promise<void>((resolve, reject) => {
            try {
                this._url = url;
                this._socket = new WebSocket(url) as WebSocket;
                if (this._protocolType === "arraybuffer") {
                    this._socket.binaryType = this._protocolType;
                }
                if (Assert.handle(Assert.Type.CreateObjectException, this._socket, "原生webSocket")) {
                    this._readyState = this._socket.readyState;
                    Debug.info(this.toString(), '发起连接');
                    resolve();
                }
                else {
                    reject("未知错误");
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        this._socket.send(data);
    }

    public close(code: number = 1000, reason?: string) {
        this._socket.close(code, reason);
        this._readyState = this._socket.readyState;
        Debug.info(this.toString(), '关闭网络连接');
    }

    public onOpen(callback: () => void) {
        this._socket.addEventListener('open', () => {
            this._readyState = this._socket.readyState;
            SAFE_CALLBACK(callback);
        });
    }
    public onMessage(callback: (data: any) => void) {
        this._socket.addEventListener('message', (res: MessageEvent) => {
            SAFE_CALLBACK(callback, res.data);
        });
    }
    public onClose(callback: (res: {code: number; reason: string;}) => void) {
        this._socket.addEventListener('close', (res) => {
            this._readyState = this._socket.readyState;
            SAFE_CALLBACK(callback, res);
        });
    }
    public onError(callback: () => void) {
        this._socket.addEventListener('error', () => {
            SAFE_CALLBACK(callback);
        });
    }
}