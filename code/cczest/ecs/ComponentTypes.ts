import { IComponent } from "zest";
import { tools } from "../tools";
import { createMap, removeElement } from "./ecs-utils";

interface IComponentType extends IComponent {
    componentId: number;
}

/**存放组件对象 */
export class DataPool {
    private static _ins: DataPool = null;

    private _pool: tools.ObjectPool<IComponentType>;
    constructor() {
        this._pool = new tools.ObjectPool();
    }

    public static get instance(): DataPool { 
        if (!this._ins) {
            this._ins = new DataPool();
        }
        return this._ins; 
    }

    public static destroy() {
        this._ins = null;
    }

    public size() { return this._pool.size(); }

    public put(components: IComponentType[], type: number) {
        for (let i: number = 0, len = components.length; i < len; ++i) {
            if (components[i].componentId === type) {
                this._pool.put(components[i]);
                removeElement(components, i);
                return true;
            }
        }
        return false;
    }

    public putAll(components: IComponentType[], types: number[]) {
        for (let i: number = 0, len = components.length; i < len; ++i) {
            this._pool.put(components[i]);
            delete components[i];
        }
        for (let i: number = 0, len = types.length; i < len; ++i) {
            delete types[i];
        }
        components.length = 0;
        types.length = 0;
    }

    public get() { 
        if (this._pool.size() > 0) {
            const type = this._pool.get();
            for (const k in type) {
                delete type[k];
            }
            return type;
        }
        else {
            /**
             * `createMap(true)` 用于创建无 prototype （也就无继承）的空对象。
             * 这样我们在该对象上查找属性时，就不用进行 `hasOwnProperty` 判断，此时对性能提升有帮助。
             * 如果forceDictMode=false，将会删除运算符，并且会应用在新创建的对象中。
             * 这会导致V8引擎把对象设成字典模式，并且禁止隐藏类的创建，这对于频繁发生改变的对象来说是不利的。
             */
            return createMap(true) as IComponentType;
        }
    }
}

export class ComponentTypes {
    private _types: number[];              //缓存的所引用的组件ID
    private _components: IComponentType[]; //缓存的所引用的组件
    constructor() {
        this._types      = [];
        this._components = [];
    }

    public get types(): number[] { return this._types; }

    public addComponent(type: number) {
        if (!this.hasComponent(type)) {
            this._types.push(type);
            const component: IComponentType = DataPool.instance.get();
            component.componentId = type;
            this._components.push(component);
            return true;
        }
        return false;
    }

    public getComponent(type: number) {
        for (const component of this._components) {
            if (component.componentId === type) {
                return component;
            }
        }
        return null;
    }

    public removeComponent(type: number) {
        if (this.hasComponent(type)) {
            removeElement(this._types, this._types.indexOf(type));
            return DataPool.instance.put(this._components, type);
        }
        return false;
    }

    public removeAllComponent() {
        DataPool.instance.putAll(this._components, this._types);
    }

    public hasComponent(type: number) {
        const index = this._types.indexOf(type);
        return index > -1;
    }
}