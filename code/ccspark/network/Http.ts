import { js } from "cc";
import { cc_spark_http_message, Constructor, IHttpManager, IHttpMessage } from "../lib.ccspark";
import { Debug } from "../Debugger";
import { Assert } from "../exceptions/Assert";
import { utils } from "../utils";
import { XMLHttp } from "./XMLHttp";
import { app } from "../app";


export  class CCHttp implements IHttpManager {
    private _api_url: string;
    private _key: string;
    private token: string;
    constructor() {

    }

    public get server(): string { return this._api_url; }

    private static _ins: CCHttp = null;
    public static get instance(): CCHttp {
        return this._ins = this._ins ? this._ins : new CCHttp();
    }

    public setApiServer(url: string) {
        this._api_url = url;
    }

    public setToken(key: string, token: string) {
        this._key = key;
        this.token = token;
    }

    public get<T extends IHttpMessage<any, any>>(proxyName: string, _type: new () => T): cc_spark_http_message<T> {
        if (app.game.hasProxy(proxyName)) {
            return app.game.retrieveProxy(proxyName) as cc_spark_http_message<T>;
        }
        const classRef = js.getClassByName(proxyName) as Constructor;
        if (Assert.handle(Assert.Type.GetHttpMessageClassException, classRef, proxyName)) {
            const proxy = new classRef(proxyName) as cc_spark_http_message<T>;
            app.game.registerProxy(proxy);
            return proxy;
        }
    }

    public appendToken(opt: any) {
        if (utils.isUndefined(this._key) || utils.isNull(this._key)) {
            return opt;
        }
        opt = opt || {};
        opt[this._key] = this.token;
        return opt;
    }
    
    public request(method: string, path: string, data?: any): Promise<any> {
        let URL: string = this.parsedURL(this._api_url, path, method, data);
        return XMLHttp.getInstance().promisedXHR(method, URL, data);
    }

    public downJSONFile(url: string): Promise<any> {
        Debug.info(url);
        return XMLHttp.getInstance().downJSONFile(url);
    }

    private parsedURL(url: string, path: string, method: string, data: any): string {
        let parsedURL: string = path;
        if (!parsedURL.startsWith('http://') && !parsedURL.startsWith('https://')) {
            parsedURL = url + parsedURL;
        }
        Debug.info('HTTP URL:', parsedURL);
        if (method === 'GET') {
            if (data) {
                return parsedURL + '?' + encodeURI(this.params(data));
            }
        }
        return parsedURL;
    }

    private params(data: any): string {
        let pams: string = "";
        for (let k in data) {
            if (pams != "") {
                pams += "&";
            }
            pams += k + "=" + data[k];
        }
        return pams;
    }
}
