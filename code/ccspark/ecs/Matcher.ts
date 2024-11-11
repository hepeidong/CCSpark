import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { EventSystem } from "../event";
import { IBaseEntity, IEntitiesGroup, IEntityArchetype, IEntityManager, IMatcher, IMatcherChange, ISystem, MatcherChange } from "../lib.ccspark";
import { utils } from "../utils";
import { ECS_DEBUG } from "./ECSDef";

/**-1（不符合任何匹配类型），0（继续完成匹配），1（符合all匹配类型），2（符合any匹配类型），3（符合none匹配类型） */
type MatcherType = -1|0|1|2|3;

type  MatcherParam = {
    matcherType: MatcherType;
    componentTypes: number[];
}|null;

export class Matcher<T extends IBaseEntity> implements IMatcher<T> {
    private static _priority: number;
    private _allMatch: boolean;
    private _anyMatch: boolean;
    private _noneMatch: boolean;
    private _name: string;
    private _matcherWay: MatcherParam[];
    private _cacheArchetypes: IEntityArchetype<T>[];
    private _manager: IEntityManager<T>;
    private _onMatcherChange: IMatcherChange<MatcherChange, Matcher<T>>;
    private _endCallback: Function;
    constructor(manager: IEntityManager<T>, system: ISystem) {
        this._allMatch  = false;
        this._anyMatch  = false;
        this._noneMatch = false;
        this._name = system.name;
        this._manager  = manager;
        this._matcherWay      = [];
        this._cacheArchetypes = [];
        this._onMatcherChange = new EventSystem.Signal(this);
        manager.onArchetypeChunkChange.add(this.onArchetypeChunkChange.bind(this));
    }

    public static initPriority() {
        this._priority = 1;
    }

    public get onMatcherChange() { return this._onMatcherChange; }

    public getEntities() {
        return this._manager.getEntities();
    }

    public getEntityById(id: string) {
        for (let i = 0; i < this._cacheArchetypes.length; ++i) {
            const archetype = this._cacheArchetypes[i];
            const entities = archetype.getEntities();
            for (let j = 0; j < entities.length; ++j) {
                const entity = entities[j];
                if (entity.ID === id) {
                    return entity;
                }
            }
        }
        return undefined;
    }

    public hasEntity() {
        for (const archetype of this._cacheArchetypes) {
            if (archetype.getEntities().length > 0) {
                return true;
            }
        }
        return false;
    }

    public matcherEnabled() {
        if (this._matcherWay.length === 0) {
            return true;
        }
        return this.hasEntity();
    }

    public withAll(...args: number[]) {
        if (!this._allMatch) {
            this._allMatch = true;
            this.matcherEntity(args, 1, this.allCondition);
        }
        return this;
    }

    public withAny(...args: number[]) {
        if (!this._anyMatch) {
            this._anyMatch = true;
            this.matcherEntity(args, 2, this.anyCondition);
        }
        return this;
    }

    public withNone(...args: number[]) {
        if (!this._noneMatch) {
            this._noneMatch = true;
            this.matcherEntity(args, 3, this.noneCondition);
        }
        return this;
    }

    /**
     * 遍历匹配后的实体
     * @param callback 索引index并不严格对应当前匹配到的索引所在的实体组里的位置，仅仅用于表示当前帧遍历实体开始，例如 index == 0
     * @returns 
     */
    public forEach(callback: (entity: T, index: number) => void) {
        if (this._cacheArchetypes.length > 0) {
            let len = 0;
            this._cacheArchetypes.forEach(archetype => {
                const entities = archetype.getEntities();
                entities.forEach((entity, index) => {
                    SAFE_CALLBACK(callback, entity, index + len);
                });
                len += entities.length;
            });
            SAFE_CALLBACK(this._endCallback);
        }
        return this;
    }

    public end(callback: Function) {
        if (this._cacheArchetypes.length > 0) {
            this._endCallback = callback;
        }
    }

    private matcherEntity(types: number[], matcherType: MatcherType, condition: (group: IEntityArchetype<T>, type: number, index?: number) => number) {
        const flag = this._matcherWay.length === 0;
        const matcherParam: MatcherParam = {matcherType, componentTypes: types};
        this._matcherWay.push(matcherParam);
        if (flag) {
            const groups = this._manager.getGroups();
            this.mergeEntity(types, groups, condition.bind(this));
        }
        else {
            const archetypes = this._cacheArchetypes.slice(0);
            this.mergeEntity(types, archetypes, condition.bind(this));
        }
        this.executeOnMatcherChange();
    }

    private allCondition(group: IEntityArchetype<T>, type: number, index: number): MatcherType {
        if (group.types.indexOf(type) > -1) {
            for (const e of this._matcherWay) {
                if (e.matcherType === 1) {
                    if (e.componentTypes.length === index + 1) {
                        return 1;
                    }
                    else {
                        break;
                    }
                }
            }
            return 0;
        }
        return -1;
    }

    private anyCondition(group: IEntityArchetype<T>, type: number): MatcherType {
        if (group.types.indexOf(type) > -1) {
            return 2;
        }
        return 0;
    }

    private noneCondition(group: IEntityArchetype<T>, type: number, index: number): MatcherType {
        if (group.types.indexOf(type) === -1) {
            for (const e of this._matcherWay) {
                if (e.matcherType === 3) {
                    if (e.componentTypes.length === index + 1) {
                        return 3;
                    }
                    else {
                        break;
                    }
                }
            }
            return 0;
        }
        return -1;
    }

    /**
     * 根据选择的匹配类型和匹配条件，组合所有符合条件的实体
     * @param types 组件类型组合
     * @param conditionfn 合并的条件判定回调，分为三种，all, any, none，返回值对应为-1（不符合任何匹配类型），0（符合all匹配类型），1（符合any匹配类型），2（符合none匹配类型）
     */
    private mergeEntity(types: number[], groups: IEntitiesGroup<T>|IEntityArchetype<T>[], conditionfn: (group: IEntityArchetype<T>, type: number, index?: number) => MatcherType) {
        this._cacheArchetypes = [];
        for (const key in groups) {
            const group = groups[key];
            this.mergeEntityFromGroup(group, types, conditionfn);
        }
    }

    /**
     * 从符合条件的组中组合实体
     * @param group 
     * @param types 
     * @param conditionfn 
     */
    private mergeEntityFromGroup(group: IEntityArchetype<T>, types: number[], conditionfn: (group: IEntityArchetype<T>, type: number, index?: number) => MatcherType) {
        let flag: number = this.juageCondition(group, types, conditionfn);
        if (flag > 0) {
            group.addRef(this._name);
            this.addArchetype(group);
        }
        else {
            group.delRef(this._name);
            group.onGroupReleased.remove(this.onArchetypeReleased.bind(this));
        }
    }

    private juageCondition(group: IEntityArchetype<T>, types: number[], conditionfn: (group: IEntityArchetype<T>, type: number, index?: number) => MatcherType) {
        let flag: MatcherType = -1;
        for (let i: number = 0, len = types.length; i < len; ++i) {
            flag = conditionfn(group, types[i], i);
            if (flag !== 0) {
                break;
            }
        }
        return flag;
    }

    private addArchetype(archetype: IEntityArchetype<T>) {
        archetype.onGroupReleased.add(this.onArchetypeReleased.bind(this), Matcher._priority++);
        this._cacheArchetypes.push(archetype);
    }

    private onArchetypeChunkChange(archetype: IEntityArchetype<T>) {
        let flag: MatcherType = -1;
        for (const e of this._matcherWay) {
            switch (e.matcherType) {
                case 1:
                    flag = this.juageCondition(archetype, e.componentTypes, this.allCondition.bind(this));
                    break;
            
                case 2:
                    flag = this.juageCondition(archetype, e.componentTypes, this.anyCondition.bind(this));
                    break;
    
                case 3:
                    flag = this.juageCondition(archetype, e.componentTypes, this.noneCondition.bind(this));
                    break;
    
                default:
                    break;
            }
            if (flag <= 0) {
                break;
            }
        }
        if (flag > 0) {
            this.addArchetype(archetype);
            this.executeOnMatcherChange();
        }
    }

    private onArchetypeReleased(archetype: IEntityArchetype<T>) {
        const index = this._cacheArchetypes.findIndex(item => item.version === archetype.version);
        if (index > -1) {
            ECS_DEBUG && Debug.log(archetype.toString(), "from", this.toString(), "移除组");
            this._cacheArchetypes.splice(index, 1);
            this.executeOnMatcherChange();
        }
    }

    private executeOnMatcherChange() {
        const onMatcherChange = this.onMatcherChange;
        if (onMatcherChange.active) {
            onMatcherChange.dispatch();
        }
    }

    public toString() {
        return utils.StringUtil.replace("[Matcher:{0}] ", this._name);
    }
}