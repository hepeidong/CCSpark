import { Proxy } from "../puremvc";
import { utils } from "../utils";
import { CCSocket } from "./Socket";
import { SAFE_CALLBACK_CALLER } from "../Define";
import { IResponseSocketData, ISocketData, ISocketMessage } from "../lib.ccspark";

export class CCSocketMessage<Response_T, Request_T> extends Proxy<Response_T> implements ISocketMessage<Response_T, Request_T> {
    private _socket: CCSocket;
    constructor(proxyName: string = "") {
        super(proxyName);
        this._socket = CCSocket.instance;
    }

    /**
     * 消息错误执行回调，子类应该重写此函数
     * @param code 错误码
     */
    protected onError(code: number) {}
    /**
     * 接收消息正确执行回调，子类应该重写此函数
     * @param data 数据
     */
    protected onMessage(data: Response_T) {}


    /**
     * 发送消息
     * @param param 发送消息附带的参数
     */
    public send(param: Request_T) {
        const reqData: ISocketData<Request_T> = {
            proxyName: this.getProxyName(),
            data: param
        }
        this._socket.encodingData(reqData);
    }

    /**这个函数不应外部调用 */
    public dispatch(data: IResponseSocketData) {
        if (data.code === 0) {
            this.setData(data.data);
            SAFE_CALLBACK_CALLER(this.onMessage, this, data.data);
        }
        else {
            SAFE_CALLBACK_CALLER(this.onError, this, data.code);
        }
    }

    public toString() {
        return utils.StringUtil.replace('[SocketMessage:{0}]', this.getProxyName());
    }
}