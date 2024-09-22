import { decorator } from "../decorator/Decorator";
import { Debug } from "../Debugger";
import { Exception } from "./Exception";

const {cckclass} = decorator;

@cckclass("LoadSceneException")
export class LoadSceneException extends Exception {
    private _err: any;
    constructor(message: string, err: any) {
        super(`场景 “${message}” 加载失败！`);
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