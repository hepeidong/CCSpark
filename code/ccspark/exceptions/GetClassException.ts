import { Exception } from "./Exception";

export class GetClassException extends Exception {
    private _classRef: Function;
    constructor(message: string, classRef: Function) {
        super(`${message}\n请检查该类是否使用ccsclass装饰器进行装饰。`);
        this._classRef = classRef;
    }

    public handle(): boolean {
        if (typeof this._classRef === "function") {
            return true;
        }
        throw new Error(this.toString());
    }
}