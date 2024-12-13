import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {zestClass} = decorator;

@zestClass("CreateObjectException")
export class CreateObjectException extends Exception {
    private _socket: any;
    constructor(message: string, socket: any) {
        super(`${message}对象创建失败！`);
        this._socket = socket;
    }

    public handle(): boolean {
        if (this._socket) {
            return true;
        }
        throw new Error(this.toString());
    }
}