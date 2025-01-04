import { IGameObserver, INotify } from "zest";

export abstract class CCObserver<T> implements IGameObserver<T> {
    private _name: string;
    constructor(name: string) {
        this._name = name;
    }

    public get name() { return this._name; }

    /**观察者实例化对象的时候调用，子类可以重写此函数 */
    onCreate(): void {}

    abstract update(notify: INotify<T>): void;
}