import { sys } from "cc";
import { IHttpError } from "../lib.ccspark";
import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { Assert } from "../exceptions/Assert";
import { utils } from "../utils";


const errMsg = {
    1000: "网络错误，请求超时",
    1001: "网络错误，连接失败"
}


export class XMLHttp {
    private _timeoutCount: number = 0;
    private _xmlHttp: XMLHttpRequest;

    constructor() {
        this._xmlHttp = new XMLHttpRequest();
    }

    private static _ins: XMLHttp = null;
    public static getInstance(): XMLHttp {
        if (!this._ins) {
            this._ins = new XMLHttp();
            Assert.handle(Assert.Type.CreateObjectException, this._ins, "XMLHttp");
        }
        return this._ins;
    }

    public promisedXHR(method: string, url: string, data?: any): Promise<any> {
        Debug.info("XMLHttp promisedXHR");
        return new Promise((resolve: (ret: any) => void, rejects: (ret: any) => void) => {
            try {
                this.sendRequest(method, url, (res: string) => {
                    this._timeoutCount = 0;
                    var ret = JSON.parse(res);
                    SAFE_CALLBACK(resolve, ret);
                }, rejects, data);
            } catch (e) {
                Debug.error("err:" + e);
                SAFE_CALLBACK(rejects, e);
            }
        });
    }

    public promisedWX(method: string, url: string, data?: any): Promise<any> {
        return new Promise((resolve: (ret: any) => void, rejects: (ret: IHttpError) => void) => {
            wx.request({
                url: url,
                method,
                timeout: 5000,
                data,
                success: (res: any) => {
                    SAFE_CALLBACK(resolve, res.data);
                },
                fail: rejects
            });
        });
    }

    public downJSONFile(url: string) {
        return new Promise((resolve: (res: any) => void, rejects: (res: any) => void) => {
            try {
                this.sendRequest("GET", url, (ret: any) => {
                    resolve(ret);
                }, rejects, null, "json", false);
            } catch (e) {
                SAFE_CALLBACK(rejects, e);
            }
        });
    }

    /**
     * 发生HTTP请求
     * @param method 请求类型
     * @param parsedURL 请求的地址
     * @param handler 结果回调函数
     * @param data 请求时传入的参数
     * @param responseType 返回结果类型
     * @param responseText 返回结果为 responseText
     */
    private sendRequest(
        method: string,
        parsedURL: string,
        handler: (res: any) => void,
        failfn: (res: IHttpError) => void,
        data: any,
        responseType: XMLHttpRequestResponseType = "",
        responseText: boolean = true
        ): void 
    {
        this._xmlHttp.timeout = 5000;

        this._xmlHttp.open(method, parsedURL, true);
        this._xmlHttp.responseType = responseType;

        if (sys.isNative) {
            // this._xmlHttp.setRequestHeader("Accept-Encoding", "gzip,deflate", "text/html;charset=UTF-8");
            this._xmlHttp.setRequestHeader("Accept-Encoding", "gzip,deflate");
        }
        
        this._xmlHttp.onreadystatechange = () => {
            this.onreadystatechange(responseText, handler, failfn);
        };

        this._xmlHttp.ontimeout = () => {
            this.ontimeout(method, parsedURL, handler, failfn, data, responseType, responseText);
        };

        this._xmlHttp.onerror = (error: ProgressEvent) => {
            this.onerror(parsedURL, failfn, error);
        };

        if (method === "POST") {
            this._xmlHttp.setRequestHeader("Content-Type", "application/json");
        }
        
        this._xmlHttp.send(utils.isObject(data) ? JSON.stringify(data) : '');
    }

    private onreadystatechange(responseText: boolean, handler: (res: any) => void, fail: (res: IHttpError) => void) {
        if (this._xmlHttp.readyState === 4 && (this._xmlHttp.status >= 200 && this._xmlHttp.status < 300)) {
            Debug.info("XMLHttp onreadystatechange");
            if (responseText) {
                SAFE_CALLBACK(handler, this._xmlHttp.responseText);
            }
            else {
                SAFE_CALLBACK(handler, this._xmlHttp.response);
            }
        }
        else if (this._xmlHttp.status >= 300) {
            SAFE_CALLBACK(fail, {msg: "网络连接发生未知错误", status: this._xmlHttp.status});
        }
    }

    private ontimeout(
        method: string,
        parsedURL: string,
        handler: (res: any) => void,
        failfn: (res: IHttpError) => void,
        data: any,
        responseType: XMLHttpRequestResponseType = "",
        responseText: boolean = true
    ) {
        this._timeoutCount++;
        if (this._timeoutCount === 3) {
            this._timeoutCount = 0;
            SAFE_CALLBACK(failfn, {msg: errMsg[1000], status: 1000});
        }
        else {
            this.sendRequest(method, parsedURL, handler, failfn, data, responseType, responseText);
        }
    }

    private onerror(parsedURL: string, failfn: (res: IHttpError) => void, error: ProgressEvent) {
        this._xmlHttp.abort();
        Debug.error("网络错误：" + parsedURL);
        Debug.error("错误信息", error);
        SAFE_CALLBACK(failfn, {msg: errMsg[1001], status: 1001});
    }
}
