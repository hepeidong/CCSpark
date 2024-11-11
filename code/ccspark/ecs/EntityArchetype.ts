import { Debug } from "../Debugger";
import { utils } from "../utils";
import { ECS_DEBUG } from "./ECSDef";
import { removeElement } from "./ecs-utils";
import { ArchetypeAlreadyReleasedException } from "./exceptions/ArchetypeAlreadyReleasedException";
import { GroupChange, IArchetypeChunk, IBaseEntity, IEntityArchetype, IGroupChange } from "../lib.ccspark";
import { EventSystem } from "../event";

export class EntityArchetype<T extends IBaseEntity> implements IEntityArchetype<T> {
    private _valid: boolean;
    private _reference: string[];                 //组名
    private _version: string;              //组id, 该组的唯一标示, 与系统id一致
    private _types: number[];         //该组成员实体身上需要挂载的组件, 用于区分实体是否属于该组
    private _entityChunk: T[];
    private _onGroupReleased: IGroupChange<GroupChange, IArchetypeChunk<T>>;     //组释放事件, 用于移除ECSEntityService管理中的组
    constructor(archetypeChunk: IArchetypeChunk<T>) {
        this._valid      = false;
        this._reference  = [];
        this._version    = '';
        this._types      = [];
        this._entityChunk     = [];
        this._onGroupReleased = new EventSystem.Signal(archetypeChunk, true);
    }

    public get valid() { return this._valid; }
    public get chunkCapacity() { return this._entityChunk.length; }
    public get typesCount() { return this._types.length; }
    public get version() { return this._version; }
    public get types() { return this._types; }
    public get onGroupReleased() { return this._onGroupReleased; }

    public addRef(ref: string) {
        if (this._reference.indexOf(ref) === -1) {
            this._reference.push(ref);
        }
    }

    public delRef(ref: string) {
        const index = this._reference.indexOf(ref);
        if (index > -1) {
            this._reference.splice(index, 1);
        }
    }

    public equal(ref: string) {
        return this._reference.indexOf(ref) > -1;
    }

    public setGroupId(id: string) {
        this._valid   = true;
        this._version = id;
    }

    public setComponentTypes(comments: number[]) {
        this._types = comments;
    }

    public getEntities(): T[] {
        return this._entityChunk;
    }

    /**
     * 增加组成员
     * @param member 
     */
    public addEntityToChunk(member: T): IEntityArchetype<T> {
        if (!this._valid) {
            throw new Error(new ArchetypeAlreadyReleasedException(this.toString()).toString());
        }
        this._entityChunk.push(member);
        member.setGroupId(this.version);
        return this;
    }

    /**
     * 移除组
     * @param member 
     */
    public removeEntityFromChunk(member: T): boolean {
        if (!this._valid) {
            throw new Error(new ArchetypeAlreadyReleasedException(this.toString()).toString());
        }
        const index: number = this._entityChunk.findIndex(entity => entity.ID === member.ID);
        if (index > -1) {
            removeElement(this._entityChunk, index);
            ECS_DEBUG && Debug.log(member.toString(), 'from', this.toString(), '移除实体');

            //如果该组没有可执行的实体了, 则释放该组别
            if (this._entityChunk.length === 0) {
                ECS_DEBUG && Debug.log(this.toString(), '释放组');
                this._valid = false;
                const onGroupReleased = this.onGroupReleased;
                if (onGroupReleased.active) onGroupReleased.dispatch(this);
                this.clear();
            }
            return true;
        }
        return false;
    }

    public checkComponentType(entity: T): boolean {
        if (entity.types.length === this.typesCount) {
            for (let c of this._types) {
                if (!entity.hasComponent(c)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    public toString() {
        return utils.StringUtil.replace("[EntityArchetype:{0}] ", this._version);
    }

    private clear() {
        this.onGroupReleased.clear();
        this._types = [];
    }
}