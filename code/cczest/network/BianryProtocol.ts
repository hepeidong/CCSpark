import { Debug } from "../Debugger";
import { decorator } from "../decorator";
import { ISocket_extend, ISocketProtocol } from "zest";
import { ProtocolType } from "./SocketEnum";

const {zestClass} = decorator;

/**
 * author: 何沛东
 * date: 2021/7/22
 * name: 游戏socket二进制数据协议类
 * description: 构建游戏中socket发送数据的二进制数据，项目需要依赖msgpack-lite库
 */
@zestClass(ProtocolType.ARRAY_BUFFER)
export class BianryProtocol implements ISocketProtocol {
    private _socket: ISocket_extend;
    // private _encoder: TextEncoder;
    // private _decoder: TextDecoder;
    constructor(socket: ISocket_extend) {
        this._socket = socket;
        // this._encoder = new TextEncoder();
        // this._decoder = new TextDecoder("utf-8", {fatal: true});
    }

    public encodingData(data: string) {
        // const uint8 = this._encoder.encode(JSON.stringify(data));
        const int8 = this.stringToArrayBuffer(data);
        this._socket.sendData(int8);
    }

    public decodingData(data: ArrayBuffer) {
        // const msg = this._decoder.decode(data, {stream: true});
        const msg = this.arrayBufferToString(data);
        this._socket.dispatchData(msg);
    }

    private uint8ArrayToString(array: Uint8Array) {
        var out: string, i: number, len: number, c: number;
        var char2: number, char3: number;
        out = "";
        len = array.length;
        i = 0;
        while (i < len) {
            c = array[i++];
            switch (c >> 4) {
                case 0: 
                case 1: 
                case 2: 
                case 3: 
                case 4: 
                case 5: 
                case 6: 
                case 7:
                    // 0xxxxxxx
                    out += String.fromCharCode(c);
                    break;
                case 12: case 13:
                    // 110x xxxx 10xx xxxx
                    char2 = array[i++];
                    out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                    break;
                case 14:
                    // 1110 xxxx 10xx xxxx 10xx xxxx
                    char2 = array[i++];
                    char3 = array[i++];
                    out += String.fromCharCode(((c & 0x0F) << 12) |
                        ((char2 & 0x3F) << 6) |
                        ((char3 & 0x3F) << 0));
                    break;
            }
        }
        return out;
    }

    //字符串转ArrayBuffer
    private stringToArrayBuffer(str: string) {
        var bytes = new Array();
        var len: number, c: number;
        len = str.length;
        for (var i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            if (c >= 0x010000 && c <= 0x10FFFF) {
                bytes.push(((c >> 18) & 0x07) | 0xF0);
                bytes.push(((c >> 12) & 0x3F) | 0x80);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if (c >= 0x000800 && c <= 0x00FFFF) {
                bytes.push(((c >> 12) & 0x0F) | 0xE0);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if (c >= 0x000080 && c <= 0x0007FF) {
                bytes.push(((c >> 6) & 0x1F) | 0xC0);
                bytes.push((c & 0x3F) | 0x80);
            } else {
                bytes.push(c & 0xFF);
            }
        }

        const array = new Int8Array(bytes.length);
        for (var i = 0; i <= bytes.length; i++) {
            array[i] = bytes[i];
        }
        return array;
    }

    //ArrayBuffer转字符串
    private arrayBufferToString(buffer: ArrayBuffer) {
        const uint = new Uint8Array(buffer);
        return this.uint8ArrayToString(uint);
    }
}