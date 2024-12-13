import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {zestClass} = decorator;

@zestClass("DeleteVertexException")
export class DeleteVertexException extends Exception {
    private _obj: any;
    constructor(message: string, obj: any) {
        super(`删除顶点时，这个顶点为 “${message}”！`);
        this._obj = obj;
    }

    public handle(): boolean {
        if (this._obj) {
            return true;
        }
        throw new Error(this.toString());
    }
}