import { Node, Prefab, instantiate } from "cc"
import { IConversionSystem, IEntity, IPrimaryEntity, IWorld } from "../lib.zest";


type PrefabType = {
    prefab: Node|Prefab;
    parent: Node;
}

export class ConversionSystem implements IConversionSystem {
    private _map: Map<string, PrefabType>;
    private _world: IWorld;
    constructor(world: IWorld) {
        this._map = new Map();
        this._world = world;
    }

    public add(prefab: Node|Prefab): {to: (parent: Node) => void} {
        const key = prefab.name;
        const item = {
            prefab,
            parent: null
        };
        this._map.set(key, item);
        return {to: parent => {
            this.to(key, parent);
        }};
    }

    public getPrimaryEntity(prefab: Node|Prefab) {
        const key = prefab.name;
        if (this._map.has(key)) {
            const item = this._map.get(key);
            //在当前世界创建一个初级实体
            //再创建一个包含prefab和parent的数据组件，把这个组件加入到该实体上
            const entity = this._world.entityManager.createEntity(key) as IPrimaryEntity;
            entity.template = Object.create(null);
            entity.template.prefab = item.prefab;
            entity.template.parent = item.parent;
            return entity;
        }
        else {
            throw new Error("'" + key + "'预制体没有预先设置，无法创建初级实体！");
        }
    }

    /**
     * 根据初级实体生成可用的实体
     * @param entity 
     * @returns 
     */
    public getEntity(entity: IPrimaryEntity) {
        const name = entity.template.prefab.name;
        const newEntity = this._world.entityManager.createEntity(name) as IEntity;
        const newNode = instantiate(entity.template.prefab) as Node;
        newNode.active = true;
        entity.template.parent.addChild(newNode);
        Object.defineProperty(newEntity, "node", {
            value: newNode,
            writable: true,
            configurable: true
        });
        return newEntity as IEntity;
    }

    private to(name: string, parent: Node) {
        if (this._map.has(name)) {
            const item = this._map.get(name);
            item.parent = parent;
            this._map.set(name, item);
        }
    }
}