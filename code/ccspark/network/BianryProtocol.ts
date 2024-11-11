import { ICCSocketManager, IResponseSocketData, ISocketData, ISocketProtocol } from "../lib.ccspark";


/**
 * author: 何沛东
 * date: 2021/7/22
 * name: 游戏socket二进制数据协议类
 * description: 构建游戏中socket发送数据的二进制数据，项目需要依赖msgpack-lite库
 */
export class BianryProtocol implements ISocketProtocol {
    private _socket: ICCSocketManager;
    private _encoder: TextEncoder;
    private _decoder: TextDecoder;
    constructor(socket: ICCSocketManager) {
        this._socket = socket;
        this._encoder = new TextEncoder();
        this._decoder = new TextDecoder("utf-8", {fatal: true});
    }

    public encodingData(data: ISocketData<any>) {
        const uint8Array = this._encoder.encode(JSON.stringify(data));
        this._socket.sendData(uint8Array.buffer);
    }

    public decodingData(data: ArrayBuffer) {
        const msg = this._decoder.decode(data, {stream: true});
        const response = JSON.parse(msg) as IResponseSocketData;
        this._socket.dispatchData(response);
    }
}