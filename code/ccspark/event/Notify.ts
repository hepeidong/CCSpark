import { INotify } from "../lib.ccspark";

export class Notify<T> implements INotify<T> {
    private _type: string;
    private _data: T;
    constructor(data: T, type: string) {
        this._data = data;
        this._type = type;
    }

    public getData() {
        return this._data;
    }

    public getType() {
        return this._type;
    }
}