import { ICCSocketManager, IResponseSocketData, ISocketData, ISocketProtocol } from "../lib.ccspark";

/**
 * author: 何沛东
 * date: 2021/7/22
 * name: 游戏socket字符串数据协议类
 * description: 构建游戏中socket发送数据的字符串数据
 */
export class JsonProtocol implements ISocketProtocol {
    private _socket: ICCSocketManager;
    constructor(socket: ICCSocketManager) {
        this._socket = socket;
    }

    public encodingData(data: ISocketData<any>) {
        const str = JSON.stringify(data);
        this._socket.sendData(str);
    }

    public decodingData(data: string) {
        const msg = JSON.parse(data) as IResponseSocketData;
        this._socket.dispatchData(msg);
    }
}