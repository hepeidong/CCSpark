import { CCSystem } from "./System";
import { SystemUpdateSequenceSettingException } from "./exceptions/SystemUpdateSequenceSettingException";
import { asUpdateAfter, asUpdateBefore, asUpdateInGroup, removeElement } from "./ecs-utils";
import { IBaseEntity, ISystem, ISystemGroup } from "zest";
import { Debug } from "../Debugger";
import { EndEntityCommandBufferSystem } from "./EndEntityCommandBufferSystem";

export class CCSystemGroup extends CCSystem<IBaseEntity> implements ISystemGroup {
    private _subSystems: ISystem<IBaseEntity>[];
    constructor() {
        super("SystemGroup");
        this._subSystems = [];
    }

    public get subSystems() {
        const total:ISystem<IBaseEntity>[] = [];
        for (const system of this._subSystems) {
            if (system instanceof CCSystemGroup) {
                total.concat(system.subSystems);
            }
            else {
                total.push(system);
            }
        }
        return total;
    }

    public set enabled(val: boolean) {
        if (typeof val === 'boolean') {
            if (!val) {
                this.onDisable();
            }
            for (const system of this._subSystems) {
                system.enabled = val;
            }
        }
        else {
            throw Debug.error("给'enabled'赋值的类型必须是boolean");
        }
    }

    public destroySystem<T extends ISystem<IBaseEntity>>(type: {new (): T}): boolean;
    public destroySystem(className: string): boolean;
    public destroySystem() {
        if (typeof arguments[0] === 'string') {
            const arg = arguments[0];
            return this.removeSubSys((sys) => {
                return sys.name === arg;
            });
        }
        else {
            const arg = arguments[0];
            return this.removeSubSys((sys) => {
                return sys instanceof arg;
            });
        }
    }

    private removeSubSys(juage: (sys: ISystem<IBaseEntity>) => boolean) {
        for (let i: number = 0, len = this._subSystems.length; i < len; ++i) {
            if (juage(this._subSystems[i])) {
                this._subSystems.splice(i, 1);
                return true;
            }
            else {
                if (this._subSystems[i] instanceof CCSystemGroup) {
                    if ((this._subSystems[i] as CCSystemGroup).destroySystem(arguments[0])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    protected onCreate(): void {
        for (const system of this._subSystems) {
            system.create();
        }
    }

    protected onStart(): void {
        for (const system of this._subSystems) {
            system.start();
        }
    }

    protected onUpdate(dt: number): void {
        for (const system of this._subSystems) {
            system.update(dt);
        }
    }

    public addSystemToUpdateList(system: ISystem<IBaseEntity>) {
        if (!(system instanceof EndEntityCommandBufferSystem)) {
            system.setEndEntityCommandBufferSystem(this._endEntityCommandBufferSystem);
        }
        this._subSystems.push(system);
    }

    public addSubSystemToGroup(subSys: ISystem<IBaseEntity>) {
        for (const sys of this._subSystems) {
            if (sys instanceof asUpdateInGroup(subSys)) {
                (sys as CCSystemGroup).addSystemToUpdateList(subSys);
                return true;
            }
            else if ((sys as CCSystemGroup).addSubSystemToGroup(subSys)) {
                return true;
            }
        }
        return false;
    }

    public sortSystemUpdateList() {
        const tempList: ISystem<IBaseEntity>[] = [];
        //把没有被开发者规定更新顺序的系统率先整理到tempList
        for (let i: number = 0, len = this._subSystems.length; i < len; ++i) {
            let system = this._subSystems[i];
            if (!asUpdateBefore(system) && !asUpdateAfter(system)) {
                tempList.push(system);
                //当前位置元素已经整理完，要及时把当前位置元素从数组中去除，
                //为了执行效率，直接把最末尾的元素替换当前位置元素，改变数组
                //长度和i的大小
                let result = removeElement(this._subSystems, i, len);
                i = result.i;
                len = result.len;
            }
        }
        //整理各系统在数组内的顺序，以便确定开发者规定的update更新顺序
        this.backtrackingSort(tempList);
    }

    /**
     * 回溯排序各系统的更新顺序 ，注意只排序设置了updateBefore和updateAfter特性的系统，
     * 其余各系统的更新顺序将是不确定的
     * */
    private backtrackingSort(array: any[]) {
        for (let i: number = 0, len = this._subSystems.length; i < len; ++i) {
            let system = this._subSystems[i];
            if (asUpdateBefore(system) && !asUpdateAfter(system)) {
                let tempIndex: number = this.traversalType(array, asUpdateBefore(system));
                if (tempIndex < array.length && tempIndex > -1) {
                    this.inserts(array, tempIndex, system);
                    //当前位置元素已经整理完，要及时把当前位置元素从数组中去除，
                    //为了执行效率，直接把最末尾的元素替换当前位置元素，改变数组
                    //长度和i的大小
                    let result = removeElement(this._subSystems, i, len);
                    i = result.i;
                    len = result.len;
                }
                else {
                    throw new Error('设置updateBefore特性时，在同一组中没有找到目标系统');
                }
            }
            else if (!asUpdateBefore(system) && asUpdateAfter(system)) {
                let tempIndex: number = this.traversalType(array, asUpdateAfter(system));
                if (tempIndex < array.length && tempIndex > -1) {
                    if (tempIndex === array.length - 1) {
                        array[tempIndex + 1] = system;
                    }
                    else {
                        this.inserts(array, tempIndex + 1, system);
                    }
                    let result = removeElement(this._subSystems, i, len);
                    i = result.i;
                    len = result.len;
                }
                else {
                    throw new Error('设置updateAfter特性时，在同一组中没有找到目标系统');
                }
            }
            else if (asUpdateBefore(system) && asUpdateAfter(system)) {
                throw new Error(new SystemUpdateSequenceSettingException(system.toString()).toString());
            }
            //此条件成立，说明数组中仍然有元素还没有整理完，需要继续整理
            //回溯到数组开头，继续整理
            if (len > 0 && i === len - 1) {
                i = -1;
            }
        }
        
        this._subSystems = array;
    }

    private traversalType(array: any[], type: any) {
        let tempIndex: number = 0;
        let temp = array[tempIndex];
        while (tempIndex < array.length && !(temp instanceof type)) {
            temp = array[++tempIndex];
        }
        if (tempIndex === array.length) {
            tempIndex = -1;
        }
        return tempIndex;
    }

    private inserts(array: any[], place: number, element: any) {
        for (let i: number = array.length - 1; i >= place; --i) {
            array[i + 1] = array[i];
        }
        array[place] = element;
    }
}