import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {cckclass} = decorator;

@cckclass("InitSceneTypeException")
export class InitSceneTypeException extends Exception {
    private _type: number;
    constructor(message: string, type: number) {
        super("场景的类型不正确，" + message);
        this._type = type;
    }

    public handle(): boolean {
        if (this._type > -1) {
            return true;
        }

        throw new Error(this.toString());
    }
}