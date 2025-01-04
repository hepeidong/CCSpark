import { InitializationSystemGroup, PresentationSystemGroup, SimulationSystemGroup } from "./ComponentSystemGroup";
import { EntityManager } from "./EntityManager";
import { asUpdateInGroup, removeElement } from "./ecs-utils";
import { UUID } from "../utils";
import { getClassRefList, getSystemClassNames } from "../decorator/Decorator";
import { Constructor, IBaseEntity, IEntityManager, ISystem, IWorld } from "zest";
import { Director, director, ISchedulable, js, Scheduler } from "cc";
import { BeginInitializationEntityCommandBufferSystem } from "./BeginInitializationEntityCommandBufferSystem";
import { BeginSimulationEntityCommandBufferSystem } from "./BeginSimulationEntityCommandBufferSystem";
import { BeginPresentationEntityCommandBufferSystem } from "./BeginPresentationEntityCommandBufferSystem";
import { EndInitializationEntityCommandBufferSystem } from "./EndInitializationEntityCommandBufferSystem";
import { EndSimulationEntityCommandBufferSystem } from "./EndSimulationEntityCommandBufferSystem";
import { EndPresentationEntityCommandBufferSystem } from "./EndPresentationEntityCommandBufferSystem";
import { Matcher } from "./Matcher";
import { ConversionSystem } from "./ConversionSystem";
import { DataPool } from "./ComponentTypes";

/**
 * ECS中的默认世界
 */
export class CCWorld implements ISchedulable, IWorld {
    protected _classNames: string[];
    private _id: string;
    private _uuid: string;
    private _entityManager: IEntityManager<IBaseEntity>;
    private _initializationSystem: InitializationSystemGroup;
    private _simulationSystem: SimulationSystemGroup;
    private _presentationSystem: PresentationSystemGroup;
    private _systems: ISystem<IBaseEntity>[];
    private _convertMap: Map<string, any>;
    private _conversionSystem: ConversionSystem;
    protected constructor(id: string) {
        this._id = id;
        this._uuid = UUID.randomUUID();
        this._classNames = [];
        this._systems    = [];
        this._convertMap = new Map();
        this._conversionSystem = new ConversionSystem(this);
    }

    public get id() { return this._id; }
    public get uuid() { return this._uuid; }
    public get entityManager(): Readonly<IEntityManager<IBaseEntity>> { return this._entityManager; }
    public get systems(): Readonly<ISystem<IBaseEntity>[]> { return this._systems; }

    public getSystem<T extends ISystem<IBaseEntity>>(type: {new (...args: any[]): T}): T;
    public getSystem(className: string): any;
    public getSystem() {
        if (typeof arguments[0] === 'string') {
            const arg = arguments[0];
            return this.receiveSys((sys) => {
                return sys.name === arg;
            });
        }
        else {
            const arg = arguments[0];
            return this.receiveSys((sys) => {
                return sys instanceof arg;
            });
        }
    }

    /**
     * 从世界中销毁该系统，调用此方法，系统会被永久销毁，需要谨慎
     * @param typeOrClassName 要销毁的系统类或者系统的类名
     * 
     * @example
     * CCWorld.instance.destroySystem(MyTestSystem);
     * CCWorld.instance.destroySystem('MyTestSystem');
     */
    public destroySystem<T extends ISystem<IBaseEntity>>(type: {new (): T}): void;
    public destroySystem(className: string): void;
    public destroySystem() {
        const arg = arguments[0];
        if (this._initializationSystem.destroySystem(arg)) {
            this.removeFromSystems(arg);
        }
        else if (this._simulationSystem.destroySystem(arg)) {
            this.removeFromSystems(arg);
        }
        else if (this._presentationSystem.destroySystem(arg)) {
            this.removeFromSystems(arg);
        }
    }

    private receiveSys(juage: (sys: ISystem<IBaseEntity>) => boolean) {
        for (const system of this._systems) {
            if (juage(system)) {
                return system;
            }
        }
        return undefined;
    }

    private removeFromSystems(arg: any) {
        this.removeSys((sys) => {
            if (typeof arg === 'string') {
                return sys.name === arg;
            }
            else {
                return sys instanceof arg;
            }
        });
    }

    private removeSys(juage: (sys: ISystem<IBaseEntity>) => boolean) {
        for (let i = 0, len = this._systems.length; i < len; ++i) {
            if (juage(this._systems[i])) {
                const result = this._systems.splice(i, 1);
                result[0].destroy();
            }
        }
    }

    private createdSystem() {
        this._initializationSystem.create();
        this._simulationSystem.create();
        this._presentationSystem.create();
    }

    private beforeUpdate(dt: number) {
        this._initializationSystem.update(dt);
        if (!this._simulationSystem.startRan) {
            this._simulationSystem.start();
        }
    }

    /**世界刷新函数，不能外部调用 */
    update(dt: number) {
        this._simulationSystem.update(dt);
        if (!this._presentationSystem.startRan) {
            this._presentationSystem.start();
        }
    }

    private afterUpdate(dt: number) {
        this._presentationSystem.update(dt);
    }

    /**
     * 对当前世界中的系统进行实例化，并按照开发者设定的更新顺序以及默认的更新顺序，
     * 把系统加入到相应的系统组里，并最终确定各系统在世界的更新顺序。如果没有手动设
     * 定系统更新顺序，则无法保障系统的更新顺序是按照您所希望的顺序进行更新。
     */
    public initializetion(componentNum: {}, totalComponent: number) {
        Matcher.initPriority();
        this._entityManager = new EntityManager(componentNum, totalComponent);
        if (this._classNames.length === 0) {
            this._classNames = getSystemClassNames();
        }
        //初始化系统会把系统按照设定进行排序，以使update的时候，系统按照设定的顺序刷新
        this.initSystem();
        this.createdSystem();
        //缓存转换对象
        this.cacheConvertObject();
        //绑定update定时器
        const scheduler: Scheduler = director.getScheduler();
        Scheduler.enableForTarget(this);
        scheduler.scheduleUpdate(this, -1, false);
        director.on(Director.EVENT_BEFORE_UPDATE, this.beforeUpdate, this);
        director.on(Director.EVENT_AFTER_UPDATE, this.afterUpdate, this);
        this._initializationSystem.start();
    }

    public destroyWorld() {
        const scheduler: Scheduler = director.getScheduler();
        scheduler.unscheduleUpdate(this);
        director.off(Director.EVENT_BEFORE_UPDATE, this.beforeUpdate, this);
        director.off(Director.EVENT_AFTER_UPDATE, this.afterUpdate, this);
        DataPool.destroy();
    }

    /**
     * 声明预制体，对需要转换为实体的预制体进行预先声明
     * @param thisArg 
     */
    public declareReference(thisArg: any) {
        let name = thisArg["__classname__"];
        if (!name) name = thisArg["__cid__"];
        if (this._convertMap.has(name)) {
            thisArg.declareReference(this._conversionSystem);
        }
    }

    /**
     * 把已经预先声明的预制体转换为实体
     * @param thisArg 
     */
    public convert(thisArg: any) {
        let name = thisArg["__classname__"];
        if (!name) name = thisArg["__cid__"];
        if (this._convertMap.has(name)) {
            thisArg.convert(this._conversionSystem);
        }
    }

    public getBeginCommandBuffer(type: CCWorld.CommandBuffer) {
        switch(type) {
            case CCWorld.CommandBuffer.InitializationCommandBuffer:
                return this.getSystem(BeginInitializationEntityCommandBufferSystem);

            case CCWorld.CommandBuffer.PresentationCommandBuffer:
                return this.getSystem(BeginPresentationEntityCommandBufferSystem);

            case CCWorld.CommandBuffer.SimulationCommandBuffer:
                return this.getSystem(BeginSimulationEntityCommandBufferSystem);
        }
    }

    public getEndCommandBuffer(type: CCWorld.CommandBuffer) {
        switch(type) {
            case CCWorld.CommandBuffer.InitializationCommandBuffer:
                return this.getSystem(EndInitializationEntityCommandBufferSystem);

            case CCWorld.CommandBuffer.PresentationCommandBuffer:
                return this.getSystem(EndPresentationEntityCommandBufferSystem);

            case CCWorld.CommandBuffer.SimulationCommandBuffer:
                return this.getSystem(EndSimulationEntityCommandBufferSystem);
        }
    }

    private cacheConvertObject() {
        //缓存转换对象
        const list = getClassRefList();
        for (const ref of list) {
            let name = ref["__classname__"];
            if (!name) name = ref["__cid__"];
            if (!this._convertMap.has(name)) {
                this._convertMap.set(name, ref);
            }
        }
    }
   
    private initSystem() {
        const subSystems: ISystem<IBaseEntity>[] = [];
        const endInitializationEntityCommandBufferSystem = new EndInitializationEntityCommandBufferSystem();
        const endSimulationEntityCommandBufferSystem = new EndSimulationEntityCommandBufferSystem();
        const endPresentationEntityCommandBufferSystem = new EndPresentationEntityCommandBufferSystem();
        for (const cls of this._classNames) {
            const classRef = js.getClassByName(cls) as Constructor;
            const system = new classRef() as ISystem<IBaseEntity>;
            system.setPool(this._entityManager);
            system.setMatcher(new Matcher(this._entityManager, system));
            //首先给基础的三个根系统组增加Begin的EntityCommandBufferSystem系统
            if (system instanceof InitializationSystemGroup) {
                this._initializationSystem = system;
                this._initializationSystem.setEndEntityCommandBufferSystem(endInitializationEntityCommandBufferSystem);
                this._initializationSystem.addSystemToUpdateList(new BeginInitializationEntityCommandBufferSystem(this._conversionSystem));
            }
            else if (system instanceof SimulationSystemGroup) {
                this._simulationSystem = system;
                this._simulationSystem.setEndEntityCommandBufferSystem(endSimulationEntityCommandBufferSystem);
                this._simulationSystem.addSystemToUpdateList(new BeginSimulationEntityCommandBufferSystem(this._conversionSystem));
            }
            else if (system instanceof PresentationSystemGroup) {
                this._presentationSystem = system;
                this._presentationSystem.setEndEntityCommandBufferSystem(endPresentationEntityCommandBufferSystem);
                this._presentationSystem.addSystemToUpdateList(new BeginPresentationEntityCommandBufferSystem(this._conversionSystem));
            }
            else {
                //把其他非根系统组的各子系统加入到根系统组里
                //加入的原则是检查其是否设置了updateInGroup特性
                //若没有设置此特性，则默认加入SimulationSystemGroup
                this.addSubSystemToRootGroup(system, subSystems);
            }
        }
        //增加子系统，遍历三个根系统组，检查其中的子系统是否为系统组（姑且称为子系统组），并且是subSystems里面子系统的系统组
        //如果是，则把子系统加入到对应的子系统组
        this.addSystemToGroup(subSystems);
        this._initializationSystem.addSystemToUpdateList(endInitializationEntityCommandBufferSystem);
        this._simulationSystem.addSystemToUpdateList(endSimulationEntityCommandBufferSystem);
        this._presentationSystem.addSystemToUpdateList(endPresentationEntityCommandBufferSystem);
        this._systems = this._systems.concat(
            this._initializationSystem.subSystems, 
            this._simulationSystem.subSystems, 
            this._presentationSystem.subSystems);
    }

    private addSubSystemToRootGroup(system: ISystem<IBaseEntity>, subSystems: ISystem<IBaseEntity>[]) {
        const type = asUpdateInGroup(system);
        if (typeof type === 'undefined') {
            this._simulationSystem.addSystemToUpdateList(system);
        }
        else if (typeof type === 'function') {
            const isInitialization: boolean = this._initializationSystem instanceof type;
            const isSimulation: boolean = this._simulationSystem instanceof type;
            const isPresentation: boolean = this._presentationSystem instanceof type;
            if (isInitialization) {
                this._initializationSystem.addSystemToUpdateList(system);
            }
            else if (isSimulation) {
                this._simulationSystem.addSystemToUpdateList(system);
            }
            else if (isPresentation) {
                this._presentationSystem.addSystemToUpdateList(system);
            }
            else {
                //属于其他子系统组的子系统，意思是当前子系统所在的系统组是三个根系统组之一内部又嵌套的系统组
                //例如InitializationSystemGroup系统组下嵌套了一个子系统组ASystemGroup，当前子系统属于这个ASystemGroup系统组
                subSystems.push(system);
            }
        }
        else {
            //传入的系统组类型是无效的
            throw new Error(system.toString() + "updateInGroup特性不能设置为'" + typeof type + "'");
        }
    }

    private addSystemToGroup(subSystems: ISystem<IBaseEntity>[]) {
        for (let i: number = 0, len = subSystems.length; i < len; ++i) {
            const system = subSystems[i];
            let flag: boolean = false;
            if (this._initializationSystem.addSubSystemToGroup(system)) {
                flag = true;
            }
            else if (this._simulationSystem.addSubSystemToGroup(system)) {
                flag = true;
            }
            else if (this._presentationSystem.addSubSystemToGroup(system)) {
                flag = true;
            }

            if (!flag) {
                //直接回溯到开头，重新遍历
                if (i === len - 1 && len > 0) {
                    i = -1;
                }
            }
            else {
                let result = removeElement(subSystems, i, len);
                i = result.i;
                len = result.len;
            }
        }
    }
}

export namespace CCWorld {
    export enum CommandBuffer {
        InitializationCommandBuffer,
        PresentationCommandBuffer,
        SimulationCommandBuffer
    }
}