import { EntityAlreadyHasComponentException } from "./exceptions/EntityAlreadyHasComponentException";
import { EntityDoesNotHaveComponentException } from "./exceptions/EntityDoesNotHaveComponentException";
import { EntityAlreadyReleasedException } from "./exceptions/EntityAlreadyReleasedException";
import { EntityIsNotEnabledException } from "./exceptions/EntityIsNotEnabledException";
import { ECS_DEBUG } from "./ECSDef";
import { ComponentTypes } from "./ComponentTypes";
import { utils } from "../utils";
import { Debug } from "../Debugger";
import { EntityChange, IComponent, IBaseEntity, IEntityChange, IEntityManager } from "zest";
import { EventSystem } from "../event";
import { Node } from "cc";


/**
 * 实体类
 */
export class Entity implements IBaseEntity {
    private _ID: string;                      //实体ID， 实体的唯一标识
    private _name: string;                    //实体名
    private _enabled: boolean;                //是否被激活，实体一旦被销毁，则此项设为false，将被实体对象池回收
    private _destroying: boolean;             //正在准备销毁
    private _groupId: string;                 //实体被引用的所有组ID，其数量跟引用计数ref相等
    private _componentTypes: ComponentTypes;  //组件类型
    private _componentNum: {};                //所有的组件枚举
    private _onComponentAdded: IEntityChange<EntityChange, IEntityManager<IBaseEntity>>;       //增加组件时的事件回调
    private _onComponentRemoved: IEntityChange<EntityChange, IEntityManager<IBaseEntity>>;     //移除组件时的事件回调
    private _onEntityDestroyed: IEntityChange<EntityChange, IEntityManager<IBaseEntity>>;      //销毁组件时的事件回调
    constructor(context: IEntityManager<IBaseEntity>, componentNum: {}, totalComponent: number) {
        this._ID         = '';
        this._enabled    = true;
        this._destroying = false;
        this._groupId    = '';
        this._componentNum       = componentNum;
        this._componentTypes     = new ComponentTypes();
        this._onComponentAdded   = new EventSystem.Signal(context);
        this._onComponentRemoved = new EventSystem.Signal(context);
        this._onEntityDestroyed  = new EventSystem.Signal(context);
        this.initialize(totalComponent);
    }


    /**该实体的唯一标志 */
    public get ID(): string { return this._ID; }
    /**实体名 */
    public get name(): string { return this._name; }
    /**实体是否被激活 */
    public get enabled(): boolean { return this._enabled; }
    /**实体正在准备销毁 */
    public get destroying() { return this._destroying; }
    /**所有组件类型 */
    public get types(): number[] { return this._componentTypes.types; }
    /**该实体所处的所有组的所有组id */
    public get groupId(): string { return this._groupId; }
    /**组件增加后执行的回调 */
    public get onComponentAdded(): IEntityChange<EntityChange, IEntityManager<IBaseEntity>> { return this._onComponentAdded; }
    /**组件删除后执行的回调 */
    public get onComponentRemoved(): IEntityChange<EntityChange, IEntityManager<IBaseEntity>> { return this._onComponentRemoved; }
    /**该实体销毁时的回调 */
    public get onEntityDestroyed(): IEntityChange<EntityChange, IEntityManager<IBaseEntity>> { return this._onEntityDestroyed; }

    private initialize(totalComponent: number) {
        for (let i: number = 0; i < totalComponent; ++i) {
            let k: string = this._componentNum[i];
            if (!this[k]) {
                Object.defineProperty(this, k, {get: () => {
                    return this.getComponent(i);
                }});
            }
        }
    }

    public setID(id: string) {
        this._ID = id;
    }

    public setName(name: string) {
        this._name = name;
    }

    public setDestroying(destroying: boolean) {
        this._destroying = destroying;
    }

    public setEnabled(enabled: boolean) {
        this._enabled = enabled;
    }

    public destroyEntity() {
        if (!this._enabled) {
            throw new Error(new EntityAlreadyReleasedException(this.toString()).toString());
        }

        let onEntityDestroyed = this.onEntityDestroyed;
        if (onEntityDestroyed.active) onEntityDestroyed.dispatch(this);

        ECS_DEBUG && Debug.log(this.toString(), '销毁实体');
    }

    public clear() {
        this._destroying = false;
        this._enabled = false;
        this._groupId = "";
        this.removeAllComponent();
        this.onComponentAdded.clear();
        this.onComponentRemoved.clear();
        this.onEntityDestroyed.clear();
        if ("node" in this) {
            let node = this["node"] as Node;
            node.destroy();
            node = undefined;
            delete this["node"];
        }
    }

    public setGroupId(id: string) {
        this._groupId = id;
    }

    public addComponent(type: number) {
        if (!this._enabled) {
            throw new Error(new EntityIsNotEnabledException(this.toString() + " Cannot add component!").toString());
        }

        if (this._componentTypes.addComponent(type)) {
            const onComponentAdded = this.onComponentAdded;
            if (onComponentAdded.active) this.onComponentAdded.dispatch(this);
        }
        else {
            const index: number = type;
            throw new Error(new EntityAlreadyHasComponentException(
                this.toString() + 
                "Cannot add " + 
                this._componentNum[index] + 
                " component!", index).toString()); 
        }
    }

    public getComponent(type: number): IComponent {
        const component = this._componentTypes.getComponent(type);
        if (!component) {
            const index: number = type;
            throw new Error(new EntityDoesNotHaveComponentException(
                this.toString() + 
                "Cannot get " + 
                this._componentNum[index] + 
                " component!", 
                index).toString());
        }
        return component;
    }

    public getComponentIndices(): number[] {
        return this._componentTypes.types;
    }

    public removeComponent(type: number) {
        if (!this._enabled) {
            throw new Error(new EntityIsNotEnabledException(this.toString() + " Cannot remove component!").toString());
        }
        if (this._componentTypes.removeComponent(type)) {
            const onComponentRemoved = this.onComponentRemoved;
            if (onComponentRemoved.active) this.onComponentRemoved.dispatch(this);
        }
        else {
            const i: number = type;
            throw new Error(new EntityDoesNotHaveComponentException(
                this.toString() + 
                "Cannot remove " + 
                this._componentNum[i] + 
                " component from " + 
                this.toString() + "!", 
                i).toString());
        }
    }

    public removeAllComponent() {
        this._componentTypes.removeAllComponent();
    }

    public hasComponent(type: number): boolean {
        return this._componentTypes.hasComponent(type);
    }

    public toString() {
        return utils.StringUtil.replace('[Entity:{0}] ', this._name);
    }
}