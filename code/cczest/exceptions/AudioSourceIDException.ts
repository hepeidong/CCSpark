import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {zestClass} = decorator;

@zestClass("AudioSourceIDException")
export class AudioSourceIDException extends Exception {
    private _flag: boolean;
    constructor(message: string, flag: boolean) {
        super("ID为" + message + "的音频不存在或者已经移除！");
        this._flag = flag;
    }

    public handle(): boolean {
        if (this._flag) {
            return true;
        }
        throw new Error(this.toString());
    }
}