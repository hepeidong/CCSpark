import { Debug } from "../Debugger";
import { ECS_DEBUG } from "./ECSDef";
import { EntityArchetype } from "./EntityArchetype";
import { UUID } from "../utils";
import { ArchetypeChunkChange, IArchetypeChunk, IArchetypeChunkChange, IEntitiesGroup, IBaseEntity, IEntityArchetype } from "../lib.ccspark";
import { tools } from "../tools";
import { EventSystem } from "../event";
import { EntityDoesNotExistException } from "./exceptions/EntityDoesNotExistException";

export class ArchetypeChunk<T extends IBaseEntity> implements IArchetypeChunk<T> {
    private _entitiesGroup: IEntitiesGroup<T>; //存放所有正在引用的组
    private _reusableArchetype: tools.ObjectPool<IEntityArchetype<T>>; //组对象池
    private _onArchetypeChunkChange: IArchetypeChunkChange<ArchetypeChunkChange, IArchetypeChunk<T>>;
    constructor() {
        this._entitiesGroup      = {};
        this._reusableArchetype  = new tools.ObjectPool();
        this._onArchetypeChunkChange = new EventSystem.Signal(this);
    }

    public get archetypes() { return this._entitiesGroup; }
    public get onArchetypeChunkChange() { return this._onArchetypeChunkChange; }

    public createArchetype(types: number[]) {
        const archetype: IEntityArchetype<T> = this._reusableArchetype.size() > 0 ? this._reusableArchetype.get() : new EntityArchetype(this);
        archetype.setGroupId(UUID.randomUUID());
        archetype.setComponentTypes(types.slice(0));
        archetype.onGroupReleased.add(this.onGroupReleased, 0);
        this._entitiesGroup[archetype.version] = archetype;
        return archetype;
    }

    public getEntities() {
        const entities: T[] = [];
        for (const key in this._entitiesGroup) {
            const archetype = this._entitiesGroup[key];
            entities.concat(archetype.getEntities());
        }
        return entities;
    }

    public getArchetypesById(id: string) {
        return this._entitiesGroup[id];
    }

    public handleEntityComponentAdded(entity: T) {
        //可能存在该实体是新创建的，所以不属于任何实体组
        if (entity.groupId in this._entitiesGroup) {
            const archetype = this._entitiesGroup[entity.groupId];
            if (!archetype.removeEntityFromChunk(entity)) {
                throw new Error(new EntityDoesNotExistException(archetype.toString()).toString());
            }
        }
        return this.forEachEntityArchetype(entity, archetype => {
            archetype.addEntityToChunk(entity);
        });
    }

    public handleEntityComponentRemoved(entity: T) {
        const archetype = this._entitiesGroup[entity.groupId];
        if (!archetype.removeEntityFromChunk(entity)) {
            throw new Error(new EntityDoesNotExistException(archetype.toString()).toString());
        }
        //实体必须有相应的组件数据，否则则为野实体，会被记录起来
        if (entity.types.length > 0) {
            return this.forEachEntityArchetype(entity, archetype => {
                archetype.addEntityToChunk(entity);
            });
        }
        return false;
    }

    private forEachEntityArchetype(entity: T, callback: (archetype: IEntityArchetype<T>) => void) {
        for (const key in this._entitiesGroup) {
            const archetype = this._entitiesGroup[key];
            if (archetype.checkComponentType(entity)) {
                callback(archetype);
                return true;
            }
        }
        return false;
    }

    private onGroupReleased(group: IEntityArchetype<T>) {
        ECS_DEBUG && Debug.log(group.toString(), '移除组');
        delete this._entitiesGroup[group.version];
        this._reusableArchetype.put(group);
    }
}