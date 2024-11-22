import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {ccsclass} = decorator;

@ccsclass("InitViewTypeException")
export class InitViewTypeException extends Exception {
    private _type: any;
    constructor(message: string, type: any) {
        super("窗口的UI类型不正确，" + message);
        this._type = type;
    }

    public handle(): boolean {
        if (this._type > -1) {
            return true;
        }

        throw new Error(this.toString());
    }
}