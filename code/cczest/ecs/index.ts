import { IBaseEntity } from "../lib.zest";
import { InitializationSystemGroup, PresentationSystemGroup, SimulationSystemGroup } from "./ComponentSystemGroup";
import { setEcsDebug } from "./ECSDef";
import { CCSystem } from "./System";
import { CCSystemGroup } from "./SystemGroup";
import { CCWorld } from "./World";

export class ecs {
    static InitializationGroup = InitializationSystemGroup;
    static SimulationGroup = SimulationSystemGroup;
    static PresentationGroup = PresentationSystemGroup;

    /**
     * 初始化ecs世界
     * @param componentNum 所有组件枚举对象
     * @param totalComponent 组件总个数
     */
    static initializetion(componentNum: {}, totalComponent: number) {
        this.World.createDefaultWorld();
        this.World.instance.initializetion(componentNum, totalComponent);
    }

    /**销毁ECS世界 */
    static destroyWorld() {
        this.World.destroyWorld();
    }

    /**打开ecs日志 */
    static openDebug(debug: boolean) {
        setEcsDebug(debug);
    }
}

export namespace ecs {
    export class System<T extends IBaseEntity> extends CCSystem<T> {}
    /**系统组只用于组织某种类型的系统，即一种系统的容器，不应在此实现游戏逻辑 */
    export class SystemGroup extends CCSystemGroup {}
    export class World extends CCWorld {
        private static _worldMap: Map<string, CCWorld> = new Map();
        private constructor(id: string) {
            super(id);
        }
        public static get instance() {
            return this._worldMap.get("DefaultWorld");
        }
    
        public static createDefaultWorld() {
            const world = new World("DefaultWorld");
            this._worldMap.set(world.id, world);
        }

        public static destroyWorld(id: string = "DefaultWorld") {
            this.instance.destroyWorld();
            this._worldMap.delete(id);
        }
    }
}