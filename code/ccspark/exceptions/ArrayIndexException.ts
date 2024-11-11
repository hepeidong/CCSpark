import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {ccsclass} = decorator;

@ccsclass("ArrayIndexException")
export class ArrayIndexException extends Exception {
    private _condition: boolean;
    constructor(message: string, condition: boolean) {
        super(message + "数组索引越界！");
        this._condition = condition;
    }

    public handle(): boolean {
        if (this._condition) {
            return true;
        }
        throw new Error(this.toString());
    }
}