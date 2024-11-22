import { Game, game } from "cc";
import { decorator } from "../decorator/Decorator";
import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { GameSocket } from "./GameSocket";
import { cc_zest_socket_protocol } from "../lib.ccspark";

const {ccsclass} = decorator;

/**
 * author: 何沛东
 * date: 2021/7/25
 * name: 字节平台socket代理类
 * description: 负责游戏中的字节平台网络连接
 */
@ccsclass("TTSocket")
export class TTSocket extends GameSocket<tt.TTSocket> {
    private _event_hide: boolean;
    private _contentType: string;
    constructor() {
        super('TTSocket');
        this._event_hide = false;
        game.on(Game.EVENT_HIDE, () => this.closeSocket, this);
        game.on(Game.EVENT_SHOW, this.connectSocket, this);
    }

    public set protocolType(type: cc_zest_socket_protocol) {
        this._protocolType = type;
        if (type === "arraybuffer") {
            this._contentType = "application/octet-stream";
        }
        else {
            this._contentType = "application/json";
        }
    }

    public description() {
        Debug.info(this.toString(), '启用字节小游戏平台webSocket');
    }

    public connect(url: string) {
        this._url = url;
        return this.connectSocket();
    }

    public send(data: string | ArrayBuffer) {
        this._socket.send({
            data
        });
    }

    public close(code: number = 1000, reason: string = "close") {
        this._readyState = 2;
        this._socket.close({
            code,
            reason,
            success: () => {
                this._readyState = 3;
                Debug.info(this.toString(), '关闭网络连接');
            } 
        })
    }

    public onOpen(callback: () => void) {
        this._socket.onOpen(() => {
            this._readyState = 1;
            Debug.info(this.toString(), "Socket 已连接");
            SAFE_CALLBACK(callback);
        });
    }
    public onMessage(callback: (data: any) => void) {
        this._socket.onMessage((res) => {
            SAFE_CALLBACK(callback, res.data);
        });
    }
    public onClose(callback: (res: {code: number; reason: string;}) => void) {
        this._socket.onClose((res) => {
            Debug.error(this.toString(), res.errMsg);
            SAFE_CALLBACK(callback, res);
        });
    }
    public onError(callback: () => void) {
        this._socket.onError((res) => {
            Debug.error(this.toString(), res.errMsg);
            SAFE_CALLBACK(callback, res.errMsg);
        });
    }

    private closeSocket() {
        this._event_hide = true;
        this.close(0);
    }

    private connectSocket() {
        return new Promise<void>((resolve, reject) => {
            Debug.info(this.toString(), '发起连接');
            if (!this._event_hide) {
                this._event_hide = false;
                this._readyState = 0;
                this._socket = tt.connectSocket({
                    url: this._url,
                    header:{
                        "content-type": this._contentType
                    },
                    fail: (res: {errMsg: string}) => {
                        reject(res.errMsg);
                    },
                    success: () => {
                        Debug.info(this.toString(), 'Socket 连接成功');
                        resolve();
                    }
                });
            }
        });
    }
}