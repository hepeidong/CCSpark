import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {zestClass} = decorator;

@zestClass("GetComponentException")
export class GetComponentException extends Exception {
    private _flag: boolean;
    constructor(message: string, flag: boolean) {
        super(`缺少 “${message}” 组件`);
        this._flag = flag;
    }

    public handle(): boolean {
        if (this._flag) {
            return true;
        }
        throw new Error(this.toString());
    }
}