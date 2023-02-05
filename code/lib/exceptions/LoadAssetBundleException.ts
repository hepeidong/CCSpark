import { App, Debug } from "../cck";
import { Exception } from "./Exception";

const {cckclass} = App.decorator;

@cckclass("LoadAssetBundleException")
export class LoadAssetBundleException extends Exception {
    private _err: string;
    constructor(message: string, err: any) {
        super(`资源包 “${message}” 加载失败！`);
        this._err = err;
    }

    public handle(): boolean {
        if (!this._err) {
            return true;
        }
        Debug.error(this.toString());
        throw this._err;
    }
}