import { Proxy } from "../puremvc";
import { utils } from "../utils";
import { Socket } from "./Socket";
import { cc_zest_socket_data, ISocketMessage } from "../lib.ccspark";

export class CCSocketMessage<Response_T, Request_T> extends Proxy<Response_T> implements ISocketMessage<Response_T, Request_T> {
    private _dataType: cc_zest_socket_data;
    private _socket: Socket;
    constructor(proxyName: string = "") {
        super(proxyName);
        this._socket = Socket.instance;
        this._dataType = this.onCreate();
        if (this._dataType == "null") {
            throw new Error("没有指定消息的数据类型，请重写‘onCreate’函数，以指定数据类型！");
        }
    }

    /**
     * 在这里返回消息体中数据的类型，即ISocketData结构体中data的数据类型
     * 
     * 和服务器约定，给服务器传输的数据是以‘|’分割开来的字符串或者这种形式的字符串转换后的二进制数据
     * 
     * 数据格式为 “消息名字符串|具体的数据转换后的字符串” 
     * 
     * 当服务器向客户端转发数据时，数据格式为 “消息名字符串|错误码字符串|具体的数据字符串”
     */
    protected onCreate():cc_zest_socket_data { return "null"; }

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
        //把消息组合成一串字符串发送出去
        let str = this.getProxyName() + "|";
        if (this._dataType == "array" || this._dataType == "object") {
            str += JSON.stringify(param);
        }
        else if(this._dataType == "boolean") {
            str += param ? "true" : "false";
        }
        else if (this._dataType == "int" || this._dataType == "float") {
            str += param.toString();
        }
        else {
            str += param;
        }
        this._socket.encodingData(str);
    }

    /**这个函数不应外部调用 */
    public dispatch(data: string) {
        //当服务器向客户端转发数据时，数据格式为 “消息名字符串|错误码字符串|具体的数据字符串”
        const result = data.split("|");
        const code = parseInt(result[1]); //消息字符串第二个字符串一定是code
        if (code === 0) {
            let body: any;
            if (this._dataType == "array" || this._dataType == "object") {
                body = JSON.parse(result[2]);
            }
            else if (this._dataType == "boolean") {
                if (result[2] == "true") {
                    body = true;
                }
                else if (result[2] == "false") {
                    body = false;
                }
            }
            else if (this._dataType == "int") {
                body = parseInt(result[2]);
            }
            else if (this._dataType == "float") {
                body = parseFloat(result[2]);
            }
            else {
                body = result[2];
            }
            this.setData(body);
            this.onMessage(body);
        }
        else {
            this.onError(code);
        }
    }

    public toString() {
        return utils.StringUtil.replace('[SocketMessage:{0}]', this.getProxyName());
    }
}