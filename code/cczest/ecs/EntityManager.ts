import { Entity } from "./Entity";
import { EntityIsNotReleasedException } from "./exceptions/EntityIsNotReleasedException";
import { UUID } from "../utils";
import { EntityAlreadyDestroyedException } from "./exceptions/EntityAlreadyDestroyedException";
import { ECS_DEBUG } from "./ECSDef";
import { ArchetypeChunk } from "./ArchetypeChunk";
import { Debug } from "../Debugger";
import { EntityChange, IBaseEntity, IEntityArchetype, IEntityManager, IEntityChange } from "../lib.ccspark";
import { tools } from "../tools";
import { EventSystem } from "../event";


/**
 * 实体服务类, 管理运行的实体, 实体对象, 运行的组, 组对象
 */
export class EntityManager<T extends IBaseEntity> implements IEntityManager<T> {
    private _componentNum: {};               //组件枚举
    private _totalComponent: number;         //组件最大个数
    private _reusableEntitys: tools.ObjectPool<T>;             //实体对象池
    private _archetypeChunk: ArchetypeChunk<T>;
    private _cacheUpdateGroupByComponentAdded: EntityChange;          //缓存实体组件增加的事件
    private _cacheUpdateGroupByComponentRemoved: EntityChange;        //缓存实体组件移除的事件
    private _cacheEntityDestroyed: EntityChange;         //缓存实体已经销毁的事件
    private _onEntityAddComponent: IEntityChange<EntityChange, IEntityManager<IBaseEntity>>;
    private _onEntityReleased: IEntityChange<EntityChange, IEntityManager<IBaseEntity>>;   //释放实体时的事件回调，用于释放野实体
    constructor(componentNum: {}, totalComponent: number) {
        this._componentNum    = componentNum;
        this._totalComponent  = totalComponent;
        this._reusableEntitys = new tools.ObjectPool();
        this._archetypeChunk  = new ArchetypeChunk();
        this._cacheUpdateGroupByComponentAdded   = this.updateGroupByComponentAdded;
        this._cacheUpdateGroupByComponentRemoved = this.updateGroupByComponentRemoved;
        this._cacheEntityDestroyed = this.onEntityDestroyed;
        this._onEntityAddComponent = new EventSystem.Signal(this);
        this._onEntityReleased     = new EventSystem.Signal(this);
    } 

    public get onEntityAddComponent() { return this._onEntityAddComponent; }
    /**该实体释放时的回调 */
    public get onEntityReleased() { return this._onEntityReleased; }
    public get onArchetypeChunkChange() { return this._archetypeChunk.onArchetypeChunkChange; } 

    public createEntity(name: string): T {
        //构建实体对象, 注意: 用三木运算, 不要乱删东西
        const entity: IBaseEntity = this._reusableEntitys.size() > 0 ? this._reusableEntitys.get() : 
        new Entity(this, this._componentNum, this._totalComponent);
        this.initEntity(name, entity);
        ECS_DEBUG && Debug.log(entity.toString(), '创建新实体');
        return entity as T;
    }

    private initEntity(name: string, entity: IBaseEntity) {
        entity.setName(name);
        entity.setID(UUID.randomUUID());
        entity.setEnabled(true);

        entity.onComponentAdded.add(this._cacheUpdateGroupByComponentAdded);
        entity.onComponentRemoved.add(this._cacheUpdateGroupByComponentRemoved);
        entity.onEntityDestroyed.add(this._cacheEntityDestroyed);
    }

    private destroyEntity(entity: T) {
        if (!entity.enabled) {
            throw new Error(new EntityAlreadyDestroyedException(
                entity.toString() + 
                "Cannot destroy entity at name " +
                 entity.name).toString());
        }
        const group: IEntityArchetype<T> = this._archetypeChunk.getArchetypesById(entity.groupId);
        //如果销毁的是野实体，则找不到相应的实体原型，因为此时的实体不属于任何一个实体原型。
        //所谓野实体，即没有任何组件数据的实体，这种实体不属于任何一个实体原型，会被释放掉
        if (group) {
            group.removeEntityFromChunk(entity);
        }
        //先从组中移除，再调用实体的clear，因为实体clear会把一些数据清除，如果先调用clear，则无法再找到相应的组，则销毁后的实体会错误的停留在组中
        entity.clear();
        this._reusableEntitys.put(entity);
    }

    public getGroups() {
        return this._archetypeChunk.archetypes;
    }

    public getEntities(): T[] {
        return this._archetypeChunk.getEntities();
    }

    public forEach(callback: (entity: T) => void) {
        const entities = this.getEntities();
        entities.forEach(callback);
    }

    private updateGroupByComponentAdded(entity: T) {
        if (!this._archetypeChunk.handleEntityComponentAdded(entity)) {
            const archetype = this._archetypeChunk.createArchetype(entity.types);
            archetype.addEntityToChunk(entity);
            if (this.onArchetypeChunkChange.active) {
                this.onArchetypeChunkChange.dispatch(archetype);
            }
        }
        const onEntityAddComponent = this.onEntityAddComponent;
        if (onEntityAddComponent.active) {
            onEntityAddComponent.dispatch(entity);
        }
    }

    private updateGroupByComponentRemoved(entity: T) {
        if (!this._archetypeChunk.handleEntityComponentRemoved(entity)) {
            if (entity.types.length > 0) {
                const archetype = this._archetypeChunk.createArchetype(entity.types);
                archetype.addEntityToChunk(entity);
                if (this.onArchetypeChunkChange.active) {
                    this.onArchetypeChunkChange.dispatch(archetype);
                }
            }
            //实体没有组件数据，成为了野实体
            else {
                const onEntityReleased = this.onEntityReleased;
                if (onEntityReleased.active) {
                    onEntityReleased.dispatch(entity);
                }
            }
        }
    }

    private onEntityDestroyed(entity: T) {
        this.destroyEntity(entity);
        if (entity.enabled) {
            throw new Error(new EntityIsNotReleasedException(entity.toString() + "Cannot destoryed entity.").toString());
        }
    }
}