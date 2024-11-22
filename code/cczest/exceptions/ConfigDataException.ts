import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {ccsclass} = decorator;

@ccsclass("ConfigDataException")
export class ConfigDataException extends Exception {
    private _flag: boolean;
    constructor(_message: string, flag: boolean) {
        super("配置表数据类型错误，不是Array,也不是Object!");
        this._flag = flag;
    }

    public handle(): boolean {
        if (this._flag) {
            return true;
        }
        throw new Error(this.toString());
    }
}