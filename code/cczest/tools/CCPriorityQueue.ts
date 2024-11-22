import { Assert } from "../exceptions/Assert";

/**优先队列结点数据结构 */
class HeapNode<T> {
    private _value: T;
    constructor(val: T) {
        this._value = val;
    }

    public set value(val: T) { this._value = val; }
    public get value(): T { return this._value; }
    public static ParentIndex(index: number): number { return Math.floor((index - 1) / 2); }
    public static LeftIndex(index: number): number { return index * 2 + 1; }
    public static RightIndex(index: number): number { return index * 2 + 2; }
}

/**优先队列
 * 优先队列采用二叉堆存储结构（数组存储结构的二叉树），优先从左节点存储数据，第一个根节点默认也存储数据（这个可以改成第一个结点不存储数据都没问题）
 * 
 * 优先级规则可以自由的设定，通过new PriorityQueue<T>((a, b) => { return a > b; })这种模式，传入优先级规则
 * 
 * 若传入的规则中a > b，则是从大到小排列，反之，从小到大排列
 */
export class CCPriorityQueue<T> {
    private _length: number = 0;
    private _compareFn: (a: T, b: T) => boolean;

    constructor(compareFn: (a: T, b: T) => boolean) {
        this._compareFn = compareFn;
    }

    [n: number]: HeapNode<T>;
    public get Front(): T { return this[0].value; }
    public get length() { return this._length; }

    public [Symbol.iterator](): { next: Function } {
        let index: number = 0;
        let that = this;
        return {
            next: function () {
                if (index < that.length) {
                    let value: T = that[index].value;
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
     * 压入元素，从左子树开始，左子树在数组中的下标为2*i+1，因此相应的父节点下标为(i-1)/2，右子树的下标为2*i+2，相应的父节点下标为(i-2)/2
     * @param e 压入的元素
     */
    public push(e: T) {
        let node: HeapNode<T> = new HeapNode(e);
        if (Assert.handle(Assert.Type.CreateObjectException, node, "堆结点HeapNode")) {
            this[this._length++] = node;
            this.buildMaxHeap();
        }
    }

    /**构建最大堆结点，把最大堆结点上浮到队头 */
    public buildMaxHeap(): void {
        let index: number = this.length - 1;
        if (index <= 0) return;
        let parentIndex: number = HeapNode.ParentIndex(index);
        while (parentIndex >= 0 && this._compareFn && this._compareFn(this[index].value, this[parentIndex].value)) {
            this.swap(index, parentIndex);
            index = parentIndex;
            parentIndex = HeapNode.ParentIndex(index);
        }
    }

    /**
     * 出队列，把队列的根节点删除，并返回删除的元素，删除的过程是把根节点不断的下沉到最后的位置，然后删除最后一个元素
     */
    public pop(): T {
        this.searchHeap(0);
        const node: HeapNode<T> = this[--this._length];
        delete this[this.length];
        return node ? node.value : null;
    }

    /**
     * 遍历优先队列
     * @param callback 如果返回false结束遍历；如果返回true或者没有返回值，则继续遍历，直到队列被遍历完
     */
    public forEach(callback: (value: T, index: number, queue: this) => boolean|void) {
        for (let i = 0; i < this.length; ++i) {
            const node: HeapNode<T> = this[i];
            const flag = callback(node.value, i, this);
            if (typeof flag === "boolean") {
                if (!flag) return;
            }
        }
    }

    public back(index: number) {
        if (index < 0 || index >= this.length) {
            return undefined;
        }
        const node = this[index];
        if (node) {
            return node.value;
        }
        return undefined;
    }

    public delete(index: number): T {
        if (index < 0 || index >= this.length) {
            return undefined;
        }
        let ele: T = this[index].value;
        if (index === this.length - 1) {
            delete this[this._length--];
            return ele;
        }
        for (let i: number = index; i < this.length - 1; ++i) {
            this[i] = this[i + 1];
        }
        delete this[--this._length];
        return ele;
    }

    public remove(e: T) {
        for (let i = 0; i < this.length; ++i) {
            const node: HeapNode<T> = this[i];
            if (node.value === e) {
                this.delete(i);
                return true;
            }
        }
        return false;
    }

    public clear(): void {
        for (let i: number = 0; i < this.length; ++i) {
            delete this[i];
        }
        this._length = 0;
    }

    /**互换结点 */
    private swap(a: number, b: number): void {
        let temp: HeapNode<T> = this[a];
        this[a] = this[b];
        this[b] = temp;
    }

    /**搜寻和维护堆结点，把堆结点下沉到最后的叶节点 */
    private searchHeap(index: number): void {
        let lIndex: number = HeapNode.LeftIndex(index);
        let rIndex: number = HeapNode.RightIndex(index);
        let endIndex: number = this.length - 1;
        while (1) {
            if (rIndex <= endIndex) {
                if (this._compareFn && this._compareFn(this[lIndex].value, this[rIndex].value)) {
                    this.swap(index, lIndex);
                    index = lIndex;
                } else {
                    this.swap(index, rIndex);
                    index = rIndex;
                }
            } else if (lIndex <= endIndex) {
                this.swap(index, lIndex);
                index = lIndex;
            } else {
                break;
            }

            lIndex = HeapNode.LeftIndex(index);
            rIndex = HeapNode.RightIndex(index);
        }
        if (index != endIndex) {
            this.swap(index, endIndex);
        }
    }
}