import { IJobHandler, ISystem } from "../lib.ccspark";

export class JobHandler<Method> implements IJobHandler<Method> {
    protected _method: Method;
    protected _thisArg: ISystem;
    constructor(method: Method) {
        this._method = method;
    }

    public scheduler(thisArg: ISystem) {
        this._thisArg = thisArg;
    }

    public setMethod(method: Method) {
        this._method = method;
    }

    public apply(...args: any[]) {}
}