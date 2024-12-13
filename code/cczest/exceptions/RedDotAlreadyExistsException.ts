import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {zestClass} = decorator;

@zestClass("RedDotAlreadyExistsException")
export class RedDotAlreadyExistsException extends Exception {
    private _condition: boolean
    constructor(message: string, condition: boolean) {
        super(`红点${message}重复增加`);
        this._condition = condition;
    }

    public handle(): boolean {
        if (this._condition) {
            return true;
        }
        throw new Error(this.toString());
    }
}