import { decorator } from "../decorator";
import { ISocket_extend, ISocketProtocol } from "../lib.ccspark";
import { ProtocolType } from "./SocketEnum";

const {ccsclass} = decorator;

/**
 * author: 何沛东
 * date: 2021/7/22
 * name: 游戏socket字符串数据协议类
 * description: 构建游戏中socket发送数据的字符串数据
 */
@ccsclass(ProtocolType.JSON)
export class JsonProtocol implements ISocketProtocol {
    private _socket: ISocket_extend;
    constructor(socket: ISocket_extend) {
        this._socket = socket;
    }

    public encodingData(data: string) {
        this._socket.sendData(data);
    }

    public decodingData(data: string) {
        this._socket.dispatchData(data);
    }
}