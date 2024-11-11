import { IGameObserver, IGameSubject } from "../lib.ccspark";
import { Debug } from "../Debugger";
import { utils } from "../utils";
import { Notify } from "./Notify";

export class GameSubject<T> implements IGameSubject<T> {
    private _name: string;
    private _observerList: IGameObserver<T>[];
    constructor(name: string) {
        this._name = name;
        this._observerList = [];
    }

    /**
     * 增加观察者
     * @param observer 
     */
    public addObserver(observer: IGameObserver<T>) {
        if (observer) {
            const index = this._observerList.findIndex(value => value.name === observer.name);
            if (index === -1) {
                this._observerList.push(observer);
                return true;
            }
        }
        return false;
    }

    public getObserver(observerName: string) {
        const index = this._observerList.findIndex(value => value.name === observerName);
        if (index > -1) {
            return this._observerList[index];
        }
        Debug.error(`主题 “${this._name}” 找不到观察者 “${observerName}”！`);
        return null;
    }

    public hasObserver(observerName: string) {
        const index = this._observerList.findIndex(value => value.name === observerName);
        return index > -1;
    }

    /**
     * 移除观察者
     * @param observerName 
     */
    public removeObserver(observerName: string) {
        let index: number = this._observerList.findIndex(observer => observer.name === observerName);
        if (index > -1) {
            utils.ObjectUtil.removeArray(index, this._observerList);
            return true;
        }
        return false;
    }

    public notify(data: T, type: string) {
        Debug.log('观察者事件系统发射事件');
        for (let obs of this._observerList) {
            obs.update(new Notify(data, type));
        }
    }
}