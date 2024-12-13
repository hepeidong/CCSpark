import { CCALGraph } from "./CCALGraph";
import { CCASCOORD, CCAStar } from "./CCAStart";
import { CCCircularQueue } from "./CCCircularQueue";
import { CCObjectPool } from "./CCObjectPool";
import { CCPriorityQueue } from "./CCPriorityQueue";
import { CCStopwatch } from "./CCStopwatch";
import { CCDirection } from "./CCDirection";
import { CCTimer } from "./CCTimer";
export * from "./CCDirection";

export class tools {
    static get Timer() { return CCTimer; };
}

/**
 * 包含了常用的工具类的命名空间，区别于Utils，这个工具类命名空间包含的是一系列工具类，
 * 
 * 这些类往往需要实例化对象，而Utils则是提供了一系列工具方法，不需要实例化具体的工具类
 * 
 * 对象。
 */
export namespace tools {
    export class ALGraph extends CCALGraph {}
    export class Queue<T> extends CCCircularQueue<T> {}
    export class ObjectPool<T> extends CCObjectPool<T> {}
    export class PriorityQueue<T> extends CCPriorityQueue<T> {}
    export class ASCOORD extends CCASCOORD {}
    export class AStar extends CCAStar {}
    export class Stopwatch extends CCStopwatch {}
    export class Direction extends CCDirection {}
}