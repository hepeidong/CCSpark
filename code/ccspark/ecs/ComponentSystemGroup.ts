/**
 * 组件系统组文件，定义了三个最基础的三个根系统组，
 * 系统组是给各系统划分组群的集合，需要开发者自己划
 * 分具体的系统组，如果没有确定属于哪个组，则会默认
 * 划分给SimulationSystemGroup。开发者也可以根据具
 * 体需求，定义自己的系统组，但是自定义的组，也必须要
 * 以三个基础根系统组为父系统组，也就是说要包含在其中
 * 一个根系统组内。由于系统组和普通的系统，都是System
 * 类型，所以系统组可以进行嵌套。
 */

import { decorator } from "../decorator/Decorator";
import { CCSystemGroup } from "./SystemGroup";

const {ccsclass} = decorator;

@ccsclass('InitializationSystemGroup')
export class InitializationSystemGroup extends CCSystemGroup {
    constructor() {
        super();
    }
}

@ccsclass('SimulationSystemGroup')
export class SimulationSystemGroup extends CCSystemGroup {
    constructor() {
        super();
    }
}

@ccsclass('PresentationSystemGroup')
export class PresentationSystemGroup extends CCSystemGroup {
    constructor() {
        super();
    }
}