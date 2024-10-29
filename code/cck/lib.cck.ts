/**********************************************类型定义，方便兼容和扩展********************************************/

import { Scene } from "cc";
import { AnimationClip, Asset, AssetManager, AudioClip, Color, Component, dragonBones, EventMouse, EventTouch, Node, Prefab, SceneAsset, SpriteFrame, Vec2, Vec3 } from "cc";
import { Platform } from "./app/AppEnum";

export declare var global: any;

export type Constructor<T = unknown> = {new (...args: any[]): T};
export type cck_static<T, U> = {
    new (): T;
} & U;
export type ggk_readonly_dictionary<T> = Readonly<Partial<T>>;
export type cck_base_type<K, ConditionT, T1, T2> = K extends ConditionT ? T1 : T2;
export type cck_key_base_type<K, T1, T2> = K extends T1 ? string : K extends T2 ? number : never;
export type cck_map_base_type<T, K  extends number | string> = Record<K, T>;

export type cck_vm_handler_opts<DataType> = { [P in keyof DataType]: (data:  DataType[P], key: P) => void }
export type cck_vm_class<DataType> = cck_static<any, {prototype: cck_vm_handler_opts<DataType>}>;
export type cck_loader_AssetType<T = Asset> = Constructor<T>;
export type cck_initial_asset_info = {path: string, type: cck_loader_AssetType}

export type cck_win_model = "ROOT"|"DIALOG"|"ACTIVITY"|"TOAST"|"TOP";
export type cck_win_activity = {priority: number, view: IWindowBase};

export type cck_red_dot_list = {parentId: number, childId: number};

export interface ANode {
    adjvex: number;
    weight: number;
    nextArc: ANode;
}

export type cck_alGraph_edge_type = ANode;

export type cck_alGraph_value_type = string;

export interface VNode {
    data: cck_alGraph_value_type;
    firstArc: cck_alGraph_edge_type;
}

export type cck_alGraph_vertex_type = VNode;

/***************************************接口类型定义************************/
/**监听基础类型 */
export interface IListener { (...args: any[]): any }

/**信号接口类型 */
export interface ISignal<T, E> {
    readonly active: boolean;
    add(listener: T, priority?: number): void;
    dispatch(...args: any[]): void;
    remove(listener: T): void;
    clear(): void;
}

export interface IGameWorld extends IFacade {
    /**当前游戏平台 */
    readonly platform: Platform;
    /**场景管理 */
    readonly sceneManager: ISceneManager;
    /**WinForm视图加载进度回调 */
    readonly onViewProgress: IViewProgress<ViewProgress, IGameWorld>;
    /**WinForm视图加载完成回调 */
    readonly onViewComplete: IViewComplete<ViewComplete, IGameWorld>;
    /**
     * 设置游戏平台，具体的游戏平台可以通过App.Platform获取
     * @param platform 具体的平台
     */
    setPlatform(platform: Platform): void;
    /**
     * 设置当前游戏的版本号
     * @param vs 具体的版本号
     */
    setVersions(vs: string): void;
    /**获取当前游戏的版本号 */
    getVersions(): string;
    init(mask: Prefab, wait: Prefab, touchEffect: Prefab): void;
    canOpenWindow(accessId: string): boolean;
    /**
     * 加载最初始的资源，一般是游戏首页加载的资源，首页加载的资源必须是resources资源包的资源，
     * 在工程的资源管理结构中，resources资源包应该用于存放各个模块都能使用到的公用资源
     * @param onProgress 
     */
    loadInitialAsset(onProgress: (progress: number) => void): Promise<void>;
    /**
     * 获取指定文件名的游戏初始资源
     * @param filename 
     * @param type 
     * @returns 
     */
    getInitialAsset<T extends Asset>(filename: string, type: {new (): T}): T|null;
}

export interface IDocument extends IProxy {
    getArchive(): any;
    save(): boolean;
}

export interface IScene extends IMediator {
    readonly type: number;
    readonly canvas: Node;
    readonly sceneName: string;
    initView(scene: Scene): void;
    setSceneType(): void;
    runScene(wait: Node, hasTouchEffect: boolean, ...args: any[]): void;
    destroy(): void;
    onCreate(register: IRegister): number;
    onLoad(): void;
    onStart(...args: any[]): void;
    onEnd(): void;
    loadScene(onProgress?: (completedCount: number, totalCount: number, item: any) => void): void;
    update(dt: number): void;
    toString(): string;
}

export interface ISceneManager {
    readonly canvas: Node;
    getTouchEffectTemp(): Prefab;
    setTouchEffect(temp: Prefab): void;
    setMask(temp: Prefab): void;
    setViewWait(temp: Prefab): void;
    addViewMaskTo(parent: Node, page: IWindowBase, zIndex: number): void;
    delViewMask(): void;
    showWaitView(): void;
    hideWaitView(): void;
    /**
     * 设置要运行的场景，此函数通过场景名设置即将要运行的场景，可以通过传递参数的形式给即将要运行的场景传递数据。
     * 该函数设置完成场景后，会马上加载运行该场景名的游戏场景。
     * @param sceneName  场景名
     * @param args 传递给此场景的数据
     */
    setScene(sceneName: string, ...args: any[]): void;
    /**
     * 场景回退，回退到上一个运行的场景
     * @param args 传递给此场景的数据
     */
    backScene(...args: any[]): void;
}

export interface ViewProgress extends IListener { (progress: number): void; }
export interface IViewProgress<T, E> extends ISignal<T, E> {
    dispatch(progress: number): void;
}
export interface ViewComplete extends IListener { (): void; }
export interface IViewComplete<T, E> extends ISignal<T, E> {
    dispatch(): void;
}

/**
 * UI控制配置表
 * 表结构:
 * 
 *    key(uiId): string,
 *    uiType(ui类型，1是ui界面，2是按钮，3是ui中的非按钮显示区域): string,
 *    access(访问权限): boolean,
 *    lock(解锁等级): number
 */
export interface IUIControlConfig {
    readonly key: string;
    readonly uiType: number;
    readonly access: boolean;
    readonly lock: number;
}

/***********************************************音频接口类型定义**************************************/

/**音频属性类型 */
export interface IAudio {
    /**音频路径 */
    url: string;
    /**是否循环播放 */
    loop?: boolean;
    /**延迟播放（秒） */
    delay?: number;
    /**音频播放音量 */
    volume?: number;
}

/**音效属性类型 */
export interface IAudioEffect extends IAudio {
}

/**背景音频属性类型 */
export interface IAudioBGM extends IAudio {
    /**背景音乐是否可以和音效叠加,默认叠加 */
    superpose?: boolean;
}

/***************************************************************************************************/

/**********************************************动画接口类型定义*******************************************/

export type AnimatPlayStatus = "pending"|"resolved"|"rejected";

/**动画属性类型 */
export interface IAnimat {
    /**动画名称 */
    name: string;
    /**动画资源的路径 */
    url?: string;
    /**延迟播放 */
    delay?: number;
    /**迭代播放次数 */
    repeatCount?: number;
    /**播放完成了 */
    played?: boolean;
}

/**帧动画属性类型 */
export interface IFrameAnimat extends IAnimat {
    /**剪辑动画 */
    clip?: AnimationClip;
    /**动画播放速率 */
    speed?: number;
    /**动画开始时间 */
    startTime?: number;
    /**是否是默认动画 */
    default?: boolean;
    /**动画播放时长 */
    duration?: number;
}

/**spine动画属性类型 */
export interface ISpineAnimat extends IAnimat {
    /**是否循环 */
    loop?: boolean;
    trackIndex?: number;
}

/**龙骨动画属性类型 */
export interface IDragonBonesAnimat extends IAnimat {
    /**是否循环 */
    loop?: boolean;
    /**要替换的皮肤所在的ArmatureDisplay，替换皮肤时使用 */
    armatureDisplay?: dragonBones.ArmatureDisplay;
    /**当前骨骼中所有动画的时间缩放率 */
    timeScale?: number;
    /**当前的 Armature 名称 */
    armatureName?: string;
}

/*****************************************************************************************/


/**引导视图类型 */
export interface IGuideWindow extends IWindowBase {
    closeGuideWindow(): void;
}

export declare namespace BarrageArea {
    export enum TruckStatus {
        /**空闲状态 */
        LDLE,
        /**启动状态 */
        LAUNCH,
        /**出站状态 */
        OUTBOUND,
        /**到站状态 */
        PULLIN
    }
}

/**弹幕系统弹幕类型 */
export interface ITruck {
    /**弹幕ID */
    readonly ID: number;
    /**弹幕内容 */
    readonly content: number;
    /**弹幕内容颜色 */
    readonly color: Color;
    /**弹幕载体 */
    readonly carrier: Node;
    /**弹幕状态 */
    readonly status: BarrageArea.TruckStatus;
}
/**弹幕系统航线类型 */
export interface ILane {
    /**航线坐标x */
    readonly x: number;
    /**航线坐标y */
    readonly y: number;
    /**航线编号 */
    readonly num: number;
    /**航线宽 */
    readonly width: number;
    /**航线长 */
    readonly length: number;
    /**激活状态 */
    active: boolean;
    /**空闲状态 */
    readonly ldle: boolean;
}


/******************************UI模块接口类型定义***********************************/

/**UI对象池类型 */
export interface IUIPool<T> {
    [n: string]: T;
}

export interface IRegister {
    /**
     * 注册消息通知监听，handler中的body数据体可以是任意数据类型，在定义回调函数时，可以把any改成任意类型
     * @param notificationName 消息通知名
     * @param handler 接收消息返回的回调函数
     * @param target handler回调的执行者
     */
    reg(notificationName: string, handler: (body: any, type: string) => void, target: any): void;
    /**
     * 增加需要你想要关注的command，以便让window窗口能够与command通信
     * @param command 想要关注的command
     */
    addCommand(command: string): void;
}

/**视图控制器类型 */
export interface IWindowBase extends IMediator {
    readonly name: string;
    readonly node: Node;
    readonly view: Component;
    readonly hasMask: boolean;
    readonly canClose: boolean;
    readonly autoRelease: boolean;
    readonly accessId: string;
    readonly opened: boolean;
    readonly winModel: cck_win_model;
    iniViewType(): void;
    setWinName(name: string): void;
    getViewType(): number;
    isAddMask(hasMask: boolean): void;
    isClickAnyClose(can: boolean): void;
    setAutoRelease(autoRelease: boolean): void;
    load(accessId: string, isOpen: boolean, onProgress: (progress: number) => void, onComplete: () => void): void
    open(onComplete: Function, ...args: any[]): void;
    close(isDestroy?: boolean, switchingScene?: boolean): void;
}

export interface IEventBody {
    /**触发事件信息对象 */
    event: EventTouch | EventMouse;
    /**事件目标节点 */
    node: Node;
    /**事件类型，例如cc.Node.EventType.TOUCH_START */
    type: string;
}

export interface ILayerManager {
    readonly canRelease: boolean;
    setDisappears(visible: boolean): void;
    addView(view: IWindowBase): void;
    delView(cleanup: boolean): boolean;
    getView(): IWindowBase;
    hasView(view: IWindowBase): boolean;
    removeView(view: IWindowBase): boolean;
    clear(switchingScene?: boolean): void;
    getCount(): number;
}

export interface IActivityManager extends ILayerManager {
    setPriority(priority: number, view: IWindowBase): void;
    popActivity(): cck_win_activity;
}

/**UI主控器管理,是一个单例, 使用kit.windowManager访问 */
export interface IWindowManager {
    readonly Type: {
        /**根视图 */
        ROOT: number;
        /**普通视图 */
        DIALOG: number;
        /**活动视图 */
        ACTIVITY: number;
        /**冒泡提示视图 */
        TOAST: number;
        /**最顶层视图 */
        TOP
    }
    init(): void;
    getLayerManager(type: number): ILayerManager;
    setVisible(ctrlIndex: number, visible: boolean): void;
    addView(view: IWindowBase): void;
    delView(ctrlIndex: number): boolean;
    shiftMask(): void;
    getOpenCtrlCount(): number;
    clear(): void;
}

export interface BaseView extends Component {}

export interface IGameLayout extends Component {
    /**弹起窗口 */
    popup(): void;
    /**关闭窗口 */
    close(): void;
    setPopupSpring(): void;
    /**
     * 弹起窗口时执行的回调
     * @param listener 
     * @param caller 
     */
    setStartListener(listener: Function, caller: any): void;
    /**
     * 弹起窗口后执行的回调
     * @param listener 
     * @param caller 
     */
    setCompleteListener(listener: Function, caller: any): void;
    /**
     * 设置返回按钮监听回调
     * @param listener 
     */
    setBackBtnListener(listener: Function): void;
}

export interface IBaseLayout {}


/******************************************************************************/

/**************************************引导接口类型定义**************************/

export interface IGuideTarget {
    target: Node;
    targetId: string;
    guideIds: string[];
    init(): void;
}

/**
 * 引导动作类型
 * 表结构：
 * 
 *     guideId(引导id):string, 
 *     guideType(引导类型0是手指引导，1是对话引导，2是文本引导):number, 
 *     targetId(引导目标节点，例如手指指向的按钮节点):number[], 
 *     descript(文本引导或对话引导的文字描述):string, 
 *     uiId(ui视图界面ID):string, 
 *     syncId(下一步引导的id，如果没有下一步引导，则为空字符):string,
 *     showType(高亮显示的范围，1为整个窗口，2为窗口中的部分区域): number,
 *     npc(对话引导中是否为NPC): number,
 */
export interface IGuideAction {
    /**引导id */
    readonly guideId: string;
    /**引导类型0是手指引导，1是对话引导，2是文本引导 */
    readonly guideType: number;//0|1|2
    /**引导目标节点id，例如手指指向的按钮节点id */
    readonly targetId: string[];
    /**文本引导或对话引导的文字描述 */
    readonly descript: string;
    /**ui视图界面ID */
    readonly uiId: string;
    /**下一步引导的id，如果没有下一步引导，则为空字符 */
    readonly syncId: string;
    /**高亮显示的范围，1为整个窗口，2为窗口中的部分区域 */
    readonly showType: number;
    /**对话引导中是否为NPC */
    readonly npc: number;
}

/**
 * 引导管理
 * */
export interface IGuideManager {
    /**引导是否关闭了 */
    readonly isGuideClose: boolean;
    /**引导已经启动 */
    readonly isGuideLaunched: boolean;
    /**正在引导 */
    readonly isGuiding: boolean;
    /**所有的引导数据 */
    readonly guideData: {};

    /**
     * 加载引导数据
     * @param path 引导数据本地目录的路径
     * @param nameOrUrl 资源包名或者路径
     * @param onComplete 加载成功回调
     */
    loadGuideData(path: string, nameOrUrl: string, onComplete?: Function): void;
    loadGuideData(path: string, onComplete?: Function): void;
    /**
     * 设置引导视图
     * @param accessId 
     */
    setGuideView(accessId: string): void;
    /**
     * 同步引导组，在开始引导之前，必须要先同步引导组
     * @param groupId 引导组id
     * @param guideId 引导id，一般为存储的上一次已经执行完的id，如果没有，则可以不传
     */
    syncGuideGroup(groupId: string, guideId?: string): void;
    /**
     * 打开引导，让引导开始执行
     */
    guideOpen(): void;
    /**在当前这一组引导组内，是否还有引导未执行完 */
    hasGuideAction(): boolean;
    /**引导回退，即不执行下一步引导，还是从当前这一步引导开始 */
    guideRollBack(): void;
    /**暂停引导 */
    guidePause(): void;
    /**
     * 引导恢复，恢复之后会执行下一步引导, 并且必须在syncId为0时调用才有作用
     */
    guideResume(): void;
    /**在手指引导之后执行下一步, 在某些情况下可能会需要调用, 通常调用此接口的可能性不大 */
    execNextStepAfterFingerGuide(): void;
    /**
     * 注册引导执行回调
     * @param type 事件类型
     * @param listeners 监听回调
     * @param caller 事件注册者
     */
    on(type: string, listeners: (guideId: number) => void, caller: any): void;
    /**
     * 注销引导执行回调
     * @param type 事件类型
     * @param listeners 监听回调
     * @param caller 事件注册者
     */
    off(type: string, listeners: Function, caller: any): void;
}

/**********************************************************************************/

/**翻页组件事件参数类型 */
export interface IPageTurnParam {
    page: Node;
    index: number;
}

/*****************************
 * ECS模式接口类型
 * 
******************************/

export interface IComponent {}

export interface IComponentMap { [n: number]: IComponent; }

export interface IBaseEntity {
    readonly destroying: boolean;
    readonly enabled: boolean;
    readonly ID: string;
    readonly name: string;
    readonly types: number[];
    readonly groupId: string;
    readonly onComponentAdded: IEntityChange<EntityChange, IEntityManager<IBaseEntity>>;
    readonly onComponentRemoved: IEntityChange<EntityChange, IEntityManager<IBaseEntity>>;
    readonly onEntityDestroyed: IEntityChange<EntityChange, IEntityManager<IBaseEntity>>;
    setDestroying(destroying: boolean): void;
    setEnabled(enabled: boolean): void;
    setID(id: string): void;
    setName(name: string): void;
    destroyEntity(): void;
    clear(): void;
    setGroupId(id: string): void;
    /**
     * 增加组件数据
     * @param componentId 
     */
    addComponent(componentId: number): void;
    /**
     * 获取组件数据
     * @param componentId 
     */
    getComponent(componentId: number): IComponent;
    getComponentIndices(): number[];
    /**
     * 移除组件数据，移除组件数据后，可能会立马从当前系统中移除，此时调用匹配器getEntityByIndex接口可能会无法获取到相应实体
     * @param componentId 
     */
    removeComponent(componentId: number): void;
    /**移除所有组件数据 */
    removeAllComponent(): void;
    /**是否存在指定组件数据 */
    hasComponent(index: number): boolean;
    toString(): string;
}

export interface IEntity extends IBaseEntity {
    setNode(node: Node): void;
    node: Node;
}

export interface IPrimaryEntity extends IBaseEntity {
    template: {prefab: Node|Prefab;
        parent: Node;}
}

export type cck_ecs_entity = Readonly<IBaseEntity>;

export interface IMatcher<T extends IBaseEntity> {
    readonly onMatcherChange: IMatcherChange<MatcherChange, IMatcher<T>>;
    getEntities(): T[];
    getEntityById(id: string): T;
    hasEntity(): boolean;
    matcherEnabled(): boolean;
    /**
     * 匹配拥有所有指定的组件数据的实体
     * @param args 
     */
    withAll(...args: number[]): IMatcher<T>;
    /**
     * 匹配至少拥有任意一个指定的组件数据的实体
     * @param args 
     */
    withAny(...args: number[]): IMatcher<T>;
    /**
     * 匹配没有指定组件数据的实体
     * @param args 
     */
    withNone(...args: number[]): IMatcher<T>;
    /**
     * 遍历匹配后的实体
     * @param callback 索引index并不严格对应当前匹配到的索引所在的实体组里的位置，实体所在位置会在运行时随着组件数据的增减而可能发生变化，所以仅仅用于表示当前帧遍历实体开始，例如 index == 0
     * @returns 
     */
    forEach(callback: (entity: T, index: number) => void): IMatcher<T>;
    end(callback: Function): void;
}

export interface IEntityManager<T extends IBaseEntity> {
    readonly onArchetypeChunkChange: IArchetypeChunkChange<ArchetypeChunkChange, IArchetypeChunk<T>>;
    // readonly onArchetypeReleased: IGroupChange<GroupChange, IArchetypeChunk<T>>;
    readonly onEntityAddComponent: IEntityChange<EntityChange, IEntityManager<IBaseEntity>>;
    readonly onEntityReleased: IEntityChange<EntityChange, IEntityManager<IBaseEntity>>;
    createEntity(name: string): T;
    getEntities(): T[];
    getGroups(): IEntitiesGroup<T>;
    forEach(callback: (entity: T) => void): void;
}

export interface ISystem<T extends IBaseEntity = any> {
    readonly name: string;
    readonly startRan: boolean;
    readonly matcher: IMatcher<T>;
    enabled: boolean;
    setPool(pool: IEntityManager<T>): void;
    setMatcher(matcher: IMatcher<T>): void;
    setEndEntityCommandBufferSystem(endEntityCommandBufferSystem: IEndEntityCommandBufferSystem): void;
    destroyEntity(entity: T): void;
    destroyEntityAll(): void;
    /**基类方法，外部不可调用此方法，否则会引发不可预知错误 */
    create(): void;
    /**基类方法，外部不可调用此方法，否则会引发不可预知错误 */
    start(): void;
    /**基类方法，外部不可调用此方法，否则会引发不可预知错误 */
    update(dt: number): void;
    /**基类方法，外部不可调用此方法，否则会引发不可预知错误 */
    destroy(): void;
    toString(): string;
}

export interface JobInitMethod<T> extends IListener { (entity: T, conversionSystem: IConversionSystem): void; }
export interface JobEntityMethod<T> extends IListener { (entity: T): void; }
export interface IJobHandler<Method> {
    scheduler(thisArg: ISystem): void;
    setMethod(method: Method): void;
    apply(...args: any[]): void;
}

export interface IBeginEntityCommandBufferSystem {
    scheduler<T extends IBaseEntity>(thisArg: ISystem, method: JobInitMethod<T>, componentType: number): void;
}

export interface IEndEntityCommandBufferSystem {
    removeSame<T extends IBaseEntity>(entity: T): boolean;
    scheduler<T extends IBaseEntity>(thisArg: ISystem, method: JobEntityMethod<T>, entity: T): void;
}

export interface ISystemGroup extends ISystem {}

export interface IHandler {
    /**handler唯一的id */
    readonly id: number;
    /**是否只执行一次 */
    readonly once: boolean;
    /**回调函数体 */
    readonly method: Function;
    /**执行域 */
    readonly caller: any;
    /**
     * 回调执行函数
     * @param data
     * @returns {any}
     */
    apply(data: any): any;
}

export interface IHandlers { [n: number]: IHandler[]; }

export interface IArchetypeChunk<T extends IBaseEntity> {
    readonly archetypes: IEntitiesGroup<T>;
    readonly onArchetypeChunkChange: IArchetypeChunkChange<ArchetypeChunkChange, IArchetypeChunk<T>>;
    // readonly onArchetypeReleased: IGroupChange<GroupChange, IArchetypeChunk<T>>;
    createArchetype(types: number[]): IEntityArchetype<T>;
    getEntities(): T[];
    getArchetypesById(id: string): Readonly<IEntityArchetype<T>>;
    handleEntityComponentAdded(entity: T): boolean;
    handleEntityComponentRemoved(entity: T): boolean;
}

export interface IEntityArchetype<T extends IBaseEntity> {
    readonly chunkCapacity: number;
    readonly typesCount: number;
    readonly version: string;
    readonly types: number[];
    readonly onGroupReleased: IGroupChange<GroupChange, IEntityManager<T>>;
    addRef(ref: string): void;
    delRef(ref: string): void;
    equal(key: string): boolean;
    setGroupId(id: string): void;
    setComponentTypes(comments: number[]): void;
    getEntities(): T[];
    addEntityToChunk(member: T): Readonly<IEntityArchetype<T>>;
    removeEntityFromChunk(member: T): boolean;
    checkComponentType(entity: T): boolean;
    toString(): string;
}

export interface IConversionSystem {
    add(prefab: Node|Prefab): {to: (parent: Node) => void};
    /**
     * 获取初级实体
     * @param prefab 
     */
    getPrimaryEntity(prefab: Node|Prefab): IPrimaryEntity;
    /**
     * 根据初级实体生成可用的实体
     * @param entity 
     */
    getEntity(entity: IPrimaryEntity): IEntity;
}

export interface IConvertToEntity {
    declareReference(conversionSystem: IConversionSystem): void;
    convert(conversionSystem: IConversionSystem): void;
}

export interface IEntitiesGroup<T extends IBaseEntity> { [n: string]: Readonly<IEntityArchetype<T>>; }

export interface EntityChange extends IListener { (entity: IBaseEntity): void; }
export interface IEntityChange<T, E> extends ISignal<T, E> {
    dispatch(entity: IBaseEntity): void;
}

export interface GroupChange extends IListener { (entity: IEntityArchetype<IBaseEntity>): void; }
export interface IGroupChange<T, E> extends ISignal<T, E> {
    dispatch(group: IEntityArchetype<IBaseEntity>): void;
}

export interface ArchetypeChunkChange extends IListener { (archetype: IEntityArchetype<IBaseEntity>): void; }
export interface IArchetypeChunkChange<T, E> extends ISignal<T, E> {
    dispatch(archetype: IEntityArchetype<IBaseEntity>): void;
}

export interface MatcherChange extends IListener { (): void;}
export interface IMatcherChange<T, E> extends ISignal<T, E> {
    dispatch(): void;
}

export interface IWorld {
    id: string;
    uuid: string;
    entityManager: Readonly<IEntityManager<IBaseEntity>>;
    systems: Readonly<ISystem<IBaseEntity>[]>;
}

/*********************************************************************************************/

/***********************************************网络接口类型******************************************/

export interface IHttpMessage extends IProxy {
    send(param: any): IHttpMessage;
    fail(reject: (e: IHttpFail) => void): IHttpMessage;
    then(resolve: (data?: any) => void): IHttpMessage;
    catch(listeners: (err: IHttpError) => void): IHttpMessage;
}
export interface IHttpResponse/**<T = any>*/ {
    /**状态码，规定0为请求正常，其他均为请求失败 */
    code: number;
    /**请求失败错误描述 */
    msg: string;
    /**数据 */
    // data: T;
}
/**HTTP请求发生网络错误类型 */
export interface IHttpError {
    /**错误描述 */
    msg: string;
    /**错误码, 1000为连接超时导致的错误, 1001为无法连接, 通常为网络环境所致导致的错误 */
    status: number;
}
export interface IHttpFail {
     /**状态码，规定200为请求正常，其他均为请求失败 */
     code: number;
     /**请求失败错误描述 */
     msg: string;
}
export interface IHttpManager {
    /**
     * 设置http api请求的远程服务器路径
     * @param url 
     */
    setApiServer(url: string): void;
    /**
     * 设置token
     * @param key token字段
     * @param token 具体的token值
     */
    setToken(key: string, token: string): void;
    /**
     * 下载JSON文件
     * @param url 下载路径
     */
    downJSONFile(url: string, caller: any): Promise<any>;
    /**
     * 获取消息协议对象
     * @param proxyName 协议名
     * @returns 返回指定的消息协议对象
     */
    get<T extends IHttpMessage>(proxyName: string): T;
}

export interface ISocketListener<T = any> extends IListener { (code: number, data: T): void; }
export interface SocketChange extends IListener { (): void; }
export interface ISocketChange<T, E> extends ISignal<T, E> {
    dispatch(): void;
}
export interface SocketNotConnected extends IListener { (code: number, reason: string): void; }
export interface ISocketNotConnected<T, E> extends ISignal<T, E> {
    dispatch(code: number, reason: string): void;
}
export interface SocketNetworkDelay extends IListener { (networkDelay: number): void; }
export interface ISocketNetworkDelay<T, E> extends ISignal<T, E> {
    dispatch(networkDelay: number): void;
}
export interface ISocketMessage extends IProxy {
    post(listener: ISocketListener, target: any): number;
    send(data?: any): void;
    dispatch(data: any): void;
    remove(listener: ISocketListener): boolean;
    remove(id: number): boolean;
}
export interface ISocketProtocol {
    encodingData(data: any): any;
    decodingData(data: any): any;
}
/**socket消息的数据结构 */
export interface ISocketData<T = any> {
    /**消息协议的类型，提供给服务器识别，客户端和服务器约定的此消息的身份id */
    proxyName: string;
    /**错误码，对于socket长连接，错误码为0时，消息正确返回，错误码不为0时，消息处理出错 */
    code?: number;
    /**请求时的数据参数 */
    data: T;
}
export interface ISocket {
    binaryType: string;
    readonly readyState: number;
    readonly url: string;
    description(): void;
    link(url: string, callback: Function): void;
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
    close(code?: number, reason?: string): void;
    onOpen(callback: () => void);
    onMessage(callback: (evt: MessageEvent) => void);
    onClose(callback: (evt: CloseEvent) => void);
    onError(callback: () => void);
    toString(): string;
}
export interface ISocketManager {
    readonly binaryType: BinaryType;
    /**连接成功回调 */
    readonly onConnected: ISocketChange<SocketChange, ISocketManager>;
    /**连接发生异常时的回调 */
    readonly onConnectionException: ISocketChange<SocketChange, ISocketManager>;
    /**异常连接恢复, 不是重新创建了一个新的连接, 而是长时间请求无反应, 突然请求成功了 */
    readonly onConnectionRestore: ISocketChange<SocketChange, ISocketManager>;
    /**连接断开时的回调 */
    readonly onDisconnected: ISocketChange<SocketChange, ISocketManager>;
    /**连接失败回调 */
    readonly onNotConnected: ISocketNotConnected<SocketNotConnected, ISocketManager>;
    /**网络延迟回调，该回调会返回当前网络请求速度的参数 */
    readonly onNetworkDelay: ISocketNetworkDelay<SocketNetworkDelay, ISocketManager>;
    /**
     * 初始化心跳消息
     * @param pingProxyName ping消息协议
     * @param pongProxyName pong消息协议
     */
    initHeartbeat(pingProxyName: string, pongProxyName: string): void;
    /**
     * 发起连接socket
     * @param url        socket服务器地址
     * @param binaryType 传输的数据类型
     */
    link(url: string, binaryType?: BinaryType): void;
    /**发起重连 */
    reconnect(): void;
    /**
     * 正常主动关闭连接，关闭后不会再重连，谨慎调用
     */
    close(): void;
    /**
     * 获取消息协议对象
     * @param proxyName 协议名
     * @returns 返回指定的消息协议对象
     */
    get<T extends ISocketMessage>(proxyName: string): T;
}
export interface ICCSocketManager extends ISocketManager {
    encodingData(data: ISocketData): void;
    sendData(data: any): void;
    dispatchData(data: ISocketData): void;
}

/********************************************************************************/


/*******************************************红点接口类型*****************************/

export interface RedDotChange extends IListener { (status: boolean): void; }
export interface IRedDotChange<T, E> extends ISignal<T, E> {
    dispatch(status: boolean): void;
}

/**红点刷新逻辑类型接口 */
export interface IRedDotAction {
    updateStatus(): void;
}

/**红点管理接口类型, 采用单例模式设计, 使用kit.redDotManager访问 */
export interface IRedDotManager {
    /**
     * 根据ID增加红点节点
     * @param redDotId 红点ID
     * @param node     红点节点
     * @param listener 状态监听事件
     * @param target   红点状态修改逻辑所在的作用域
     */
    addRedDotNode(redDotId: number, node: Node, listener: RedDotChange, target: any): void;
    /**
     * 增加红点刷新逻辑类型
     * @param logicType 红点刷新逻辑类
     * @param redDotId  对应红点ID
     */
    addRedDotLogic<T extends IRedDotAction>(logicType: { new(): T }, redDotId: number): void;
    /**
     * 初始化红点
     * @param parentId 
     * @param childId  
     * @example
     * //常用例子
     * initRedDot(1000, 1001);
     */
    initRedDot(parentId: number, childId: number): void;
    /**
     * 设置对应红点的状态, 一般为设置儿子红点的状态
     * @param redDotId 该红点对应的编号
     * @param status 
     */
    setRedDotStatus(redDotId: number, status: boolean): void;
    /**
     * 刷新红点状态, 外部调用此方法可根据具体的红点逻辑刷新状态
     * @param redDotId 
     */
    update(redDotId: number): void;
}

/**********************************************************************************/


/**********************************游戏事件系统接口类型************************************/
export interface INotify<T> {
    getData(): T;
    getType(): string;
}
export interface IGameSubject<T> {
    addObserver(observer: IGameObserver<T>): boolean;
    getObserver(observerName: string): IGameObserver<T>;
    hasObserver(observerName: string): boolean;
    removeObserver(observerName: string): boolean;
    notify(data: T, type: string): void;
}
export interface IGameObserver<T> {
    readonly name: string;
    onCreate(): void;
    update(notify: INotify<T>): void;
}
export interface IEventBus {
    /**
     * 给指定的主题订阅观察者
     * @param subjectName 主题名
     * @param observerName 观察者名
     */
    addObserver(subjectName: string, observerName: string): boolean;
    /**
     * 获取指定观察者
     * @param observerName 要获取的观察者名
     */
    getObserver<T extends IGameObserver<any>>(observerName: string): T;
    /**
     * 根据主题获取指定的观察者
     * @param subjectName 该观察者所在的主题
     * @param observerName 要获取的观察者
     */
    getObserverBySuject<T extends IGameObserver<any>>(subjectName: string, observerName: string): T;
    /**
     * 给指定主题下的所有观察者发送通知
     * @param subjectName 主题名
     * @param data 通知携带的数据
     * @param export type 通知携带的类型
     */
    sendNotify<T>(subjectName: string, data: T, type?: string): void;
    /**
     * 移除指定主题
     * @param subjectName 要移除的主题名
     */
    removeSubject(subjectName: string): boolean;
    /**
     * 移除指定主题的某个观察者
     * @param subjectName 要移除的观察者所在的主题
     * @param observerName 要移除的观察者
     */
    removeObserver(subjectName: string, observerName: string): boolean;
    /**清除所有主题 */
    clear(): void;
}
export interface IEventListeners {
        hasListener(type: string): boolean;
        /**
         * 发射事件消息
         * @param export type 消息类型
         * @param args 消息数据
         */
        emit(type: string, ...args: any[]): boolean;
        /**
         * 注册事件监听,可以多次响应
         * @param export type 事件类型
         * @param caller 事件注册者
         * @param listener 监听函数
         * @param args 参数列表
         */
        on(type: string, caller: any, listener: Function, ...args: any[]): IEventListeners;
        /**
         * 注册事件监听，只响应一次
         * @param export type 事件类型
         * @param caller 事件注册者
         * @param listener 监听函数
         * @param args 参数列表
         */
        once(type: string, caller: any, listener: Function, ...args: any[]): IEventListeners;
        /**
         * 注销事件
         * @param export type 事件类型
         * @param caller 事件类型
         * @param listener 监听函数
         * @param once 是否注销单次响应事件
         */
        off(type: string, caller: any, listener: Function, once?: boolean): IEventListeners;
        /**
         * 注销所有事件
         * @param export type 事件类型
         */
        offAll(type?: string): IEventListeners;
        /**
         * 通过事件注册者注销所有事件
         * @param caller 事件注册者
         */
        offAllCaller(caller: any): IEventListeners;
    }

/***********************************************************************************/

/*************************************资源管理类型定义********************************/

/**
 * 对需要加载引用的资源进行注册
 */
export interface IAssetRegister {
    reset(): void;
    /**
     * 增加资源文件路径
     * @param path 
     */
    addFilePath(path: string): void;
    /**
     * 增加资源文件目录路径
     * @param path 
     */
    addDirPath(path: string): void;
}

export interface ILoader {
    load<T extends Asset>(paths: string, type: cck_loader_AssetType<T>, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: T) => void): void;
    load<T extends Asset>(paths: string[], type: cck_loader_AssetType<T>, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Array<T>) => void): void;
    load<T extends Asset>(paths: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: T) => void): void;
    load<T extends Asset>(paths: string[], onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Array<T>) => void): void;
    load<T extends Asset>(paths: string, type: cck_loader_AssetType<T>, onComplete?: (error: Error, assets: T) => void): void;
    load<T extends Asset>(paths: string[], type: cck_loader_AssetType<T>, onComplete?: (error: Error, assets: Array<T>) => void): void;
    load<T extends Asset>(paths: string, onComplete?: (error: Error, assets: T) => void): void;
    load<T extends Asset>(paths: string[], onComplete?: (error: Error, assets: Array<T>) => void): void;	

    loadDir<T extends Asset>(dir: string, type: cck_loader_AssetType<T>, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Array<T>) => void): void;
    loadDir<T extends Asset>(dir: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Array<T>) => void): void;
    loadDir<T extends Asset>(dir: string, type: cck_loader_AssetType<T>, onComplete: (error: Error, assets: Array<T>) => void): void;
    loadDir<T extends Asset>(dir: string, type: cck_loader_AssetType<T>): void;
    loadDir<T extends Asset>(dir: string, onComplete: (error: Error, assets: Array<T>) => void): void;
    loadDir<T extends Asset>(dir: string): void;

    loadScene(sceneName: string, options: Record<string, any>, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, sceneAsset: SceneAsset) => void): void;
    loadScene(sceneName: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, sceneAsset: SceneAsset) => void): void;
    loadScene(sceneName: string, options: Record<string, any>, onComplete: (error: Error, sceneAsset: SceneAsset) => void): void;
    loadScene(sceneName: string, onComplete: (error: Error, sceneAsset: SceneAsset) => void): void;
    loadScene(sceneName: string, options: Record<string, any>): void;
    loadScene(sceneName: string): void;

    /**
     * 增加资源
     * @param asset 
     */
    add(asset: Asset): void;

    /**
     * 移除单个资源
     * @param asset 要删除的资源
     */
    delete(asset: Asset): boolean;

    /**
     * 通过路径与类型获取资源
     * @param path 
     * @param export type 
     * @returns 
     */
    get<T extends Asset> (path: string, type?: Constructor<T>): T;
}

/****************************************************************************************************/


/**************************************音频，动画等特效播放管理类型定义********************************/
export type cck_audio_type = { audio: IAudioBGM | IAudioEffect; clip: AudioClip; played: boolean; bgm: boolean; audioID: number; callbacks: cck_audio_saudio_resolved_type[] };
export type cck_audio_play_callback_type = (currentTime: number) => void;
export type cck_audio_stop_callback_type = (duration: number) => void;
export type cck_audio_saudio_resolved_type = { type: string; call: any }

export type cck_animat_resolved_type = { call: Function; type: string; };
export type cck_animat_frameAnimat_type = { props: IFrameAnimat, callbacks: cck_animat_resolved_type[] };
export type cck_animat_spineAnimat_type = { props: ISpineAnimat, callbacks: cck_animat_resolved_type[] };
export type cck_animat_dragonBonesAnimat_type = { props: IDragonBonesAnimat, callbacks: cck_animat_resolved_type[] }

/**************************************************************************************/


/******************************************微信小游戏类型定义**********************************/
/**微信小游戏权限类型 */
export type AuthSetting = {
    "scope.userInfo": boolean | undefined | null,// 请用button获取该信息
    "scope.userLocation": boolean | undefined | null,
    "scope.userLocationBackground": boolean | undefined | null,
    "scope.address": boolean | undefined | null,
    "scope.invoiceTitle": boolean | undefined | null,
    "scope.invoice": boolean | undefined | null,
    "scope.werun": boolean | undefined | null,
    "scope.record": boolean | undefined | null,
    "scope.writePhotosAlbum": boolean | undefined | null,
    "scope.camera": boolean | undefined | null,
}

/***************************************/
export type cck_bitLblImage_type = { spacing: number; sf: SpriteFrame; }

export type cck_redDot_type = { parent: number[]; }

/**弹幕数据类型 */
export type barrageData_t = { content: string; color: string; }
export type barrage_t = { content: string; delay: number; color: string; }
export type barrageListenerParam_t = { carrier: Node, content: string, color: Color; };
export type barrageListener_t = (param: barrageListenerParam_t) => void;

/**时间类型 */
export type cck_utils_date_compare_type = { year: number; month: number; date: number; hours: number; }