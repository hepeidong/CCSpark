import { IHttpError, IHttpFail, IHttpMessage, IHttpResponse } from "zest";
import { Debug } from "../Debugger";
import { SAFE_CALLBACK, SAFE_CALLBACK_CALLER } from "../Define";
import { Proxy } from "../puremvc";
import { Http } from "./Http";
import { utils } from "../utils";


export class CCHttpMessage<Response_T, Request_T> extends Proxy<Response_T> implements IHttpMessage<Response_T, Request_T> {
    private _param: Request_T;
    private _http: Http;
    private _resolve: (data?: Response_T) => void;
    private _reject: (e: IHttpFail) => void;
    private _errorListeners: (err: IHttpError) => void;

    constructor(proxyName: string = null) {
        super(proxyName);
        this._http = Http.instance;
    }

    private get URL(): string { return this["_URL"]; }
    private get METHOD(): string { return this["_METHOD"]; }

    /**
     * 消息错误执行回调，子类应该重写此函数
     * @param code 错误码
     */
    protected onError(code: number, msg: string) {}
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
        this._param = param;
        this.request();
        return this;
    }

    /**
     * 设置HTTP请求时服务器返回的错误监听，此消息只接受服务器返回的错误导致的请求失败，与catch不一样，catch只返回HTTP发生的连接错误
     * @param reject 
     * @returns 
     */
    public fail(reject: (e: IHttpFail) => void): CCHttpMessage<Response_T, Request_T> {
        this._reject = reject;
        return this;
    }

    /**
     * 请求成功后返回数据
     * @param resolve 
     * @returns 
     */
    public then(resolve: (data?: Response_T) => void): CCHttpMessage<Response_T, Request_T> { 
        this._resolve = resolve;
        return this; 
    }

    /**
     * 设置HTTP请求时发生的网络错误监听, 此条件下的错误不是服务器返回的错误, 而是HTTP连接发生的错误
     * 
     * @param listeners 
     */
    public catch(listeners: (err: IHttpError) => void): CCHttpMessage<Response_T, Request_T> {
        this._errorListeners = listeners;
        return this;
    }
 
    private append() {
        return this._http.appendToken(this._param);
    }

    //发起请求
    private async request() {
        let response: IHttpResponse<Response_T>;
        let param: any = this.append();
        Debug.info(`${this.toString()} param:`, param);
        if (this.METHOD && this.METHOD.length > 0) {
            response = await this._http.request(this.METHOD, this.URL, param).catch((err: IHttpError) => {
                SAFE_CALLBACK_CALLER(this.onError, this, err.status, err.msg);
                SAFE_CALLBACK(this._errorListeners, err);
                Debug.error(`${this.toString()} ${this.METHOD} 网络连接错误:`, err);
            });
        }
        else {
            Debug.error(this.toString(), '必须指定请求的方式,GET或者POST');
        }
        if (response) {
            this.dataPars(response);
        }
    }

    //数据解析
    private dataPars(response: IHttpResponse<Response_T>) {
        if (typeof response === 'string') {
            response = JSON.parse(response);
        }
        // Debug.info(`MSG ${this.METHOD} 原始数据`, response);
        if (response.code === 0) {
            Debug.info(this.toString(), this.METHOD, this.getProxyName());
            this.setData(response.data);
            SAFE_CALLBACK_CALLER(this.onMessage, this, response);
            SAFE_CALLBACK(this._resolve, response);
        }
        else if (response) {
            SAFE_CALLBACK_CALLER(this.onError, this, response.code, response.msg);
            SAFE_CALLBACK(this._reject, {msg: response.msg, code: response.code});
            Debug.error(`${this.toString()} ${this.METHOD} 消息错误,错误码:`, response.code);
            Debug.error(`${this.toString()} ${this.METHOD} 错误接口类型:`, this.URL);
            Debug.error(`${this.toString()} ${this.METHOD} 错误消息返回:`, response.msg);
        }
    }

    public toString() {
        return utils.StringUtil.replace('[HttpMessage:{0}]', this.getProxyName());
    }
}