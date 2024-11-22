import { Assert } from "../exceptions/Assert";

/**循环队列 */
export class CCCircularQueue<T>  {
    private _front: number;
    private _rear: number;
    private _maxLength: number;
    /** 自动扩容（auto dilatation）*/
    private _auto: boolean;
    constructor(capacity: number = 64, autoDilataion: boolean = true) {
        this._front = 0;
        this._rear = 0;
        this._maxLength = capacity;
        this._auto = autoDilataion;
    }

    public get length(): number {
        return this._rear - this._front;
    }

    /**
     * 队列的容量
     * @param capacity 容量
     * @param auto 是否自动扩容
     * @constructor
     */
    public  reserve(capacity: number, auto: boolean = true): void {
        this._maxLength = capacity;
        this._auto = auto;
    }

    [n: number]: T;
    public [Symbol.iterator](): { next: Function } {
        let index: number = 0;
        let that = this;
        return {
            next: function () {
                if (index < that.length) {
                    let value: T = that[index];
                    index++;
                    return { value: value, done: false };
                }
                else {
                    return { done: true };
                }
            }
        }
    }

    /**
     * 入队列
     * @param e 入队的元素
     * @returns {boolean}
     * @constructor
     */
    public push(e: T): boolean {
        if (!this.isFull()) {
            this[this._rear] = e;
            this._rear = (this._rear + 1)%this._maxLength;
            return true;
        }
        else if (this._auto) {
            this._maxLength = this._maxLength + 50;
            this[this._rear] = e;
            this._rear = (this._rear + 1)%this._maxLength;
            return true;
        }
        else {
            return Assert.handle(Assert.Type.CircularQueueException, false, "CircularQueue is pull!");
        }
    }

    /**
     * 出列，然后删除对顶元素
     * @returns {any}
     * @constructor
     */
    public pop(): T {
        if (Assert.handle(Assert.Type.CircularQueueException, !this.isEmpty(), "CircularQueue is emty!")) {
            let e: T = this[this._front];
            delete this[this._front];
            this._front = (this._front + 1)%this._maxLength;
            return e;
        }
        return null;
    }

    /**
     * 移除指定索引的元素
     * @param index 
     * @returns 
     */
    public removeAt(index: number): boolean {
        let temp: T = this.back(index);
        if (temp) {
            for (let i: number = index; i + 1 < this.length; ++i) {
                this[i] = this[i + 1];
            }
            delete this[this._rear - 1];
            this._rear--;
            return true;
        }
        return false;
    }

    /**
     * 移除指定元素
     * @param e 
     * @returns 
     */
    public remove(e: T): boolean {
        let flag: boolean = false;
        for (let i: number = 0; i < this.length; ++i) {
            if (this[i] === e && !flag) {
                flag = true;
            }
            if (flag) {
                if (i + 1 < this.length) {
                    this[i] = this[i + 1];
                }
            }
        }
        delete this[this._rear - 1];
        this._rear--;
        return flag;
    }

    /**
     * 出列，不删除对顶元素
     * @param index
     * @returns {T}
     * @constructor
     */
    public back(index: number = this._front): T {
        return this[index];
    }

    /**
     * 遍历队列
     * @param callback 如果返回false结束遍历；如果返回true或者没有返回值，则继续遍历，直到队列被遍历完
     */
    public forEach(callback: (value: T, index: number, queue: this) => boolean|void) {
        for (let i: number = 0; i < this.length; ++i) {
            const flag = callback(this[i], i, this);
            if (typeof flag === "boolean") {
                if (!flag) return;
            }
        }
    }

    public isEmpty(): boolean {
        if (this._front == this._rear) {
            return true;
        }
        return false;
    }

    public isFull(): boolean {
        if ((this._rear + 1)%this._maxLength == this._front) {
            return true;
        }
        return false;
    }

    public clear(): void {
        for (let i: number = 0; i < this.length; ++i) {
            delete this[i];
        }
        this._front = 0;
        this._rear = 0
    }

    public contains(e: T): boolean {
        for (let i: number = 0; i < this.length; ++i) {
            if (this[i] === e) {
                return true;
            }
        }
        return false;
    }
}