import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {zestClass} = decorator;

@zestClass("FindRedDotException")
export class FindRedDotException extends Exception {
    private _redDotNode: any;
    constructor(message: string, redDotNode: any) {
        super(`红点${message}不存在`);
        this._redDotNode = redDotNode;
    }

    public handle(): boolean {
        if (this._redDotNode) {
            return true;
        }
        throw new Error(this.toString());
    }
}