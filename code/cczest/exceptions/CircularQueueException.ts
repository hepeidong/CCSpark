import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";
const {zestClass} = decorator;

@zestClass("CircularQueueException")
export class CircularQueueException extends Exception {
    private _flag: boolean;
    constructor(message: string, flag: boolean) {
        super(message);
        this._flag = flag;
    }

    public handle(): boolean {
        if (this._flag) {
            return true;
        }
        throw new Error(this.toString());
    }
}