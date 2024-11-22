import { Debug } from "../Debugger";
import { CCMathUtil } from "./CCMathUtil";


export  class CCObjectUtil {

    public static contain(obj: object, value: any): boolean {
        if (obj === null) {
            return false;
        }
        if (typeof obj === 'object') {
            for (let key in obj) {
                if (obj[key] === value) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 返回指定元素的键
     * @param obj 
     * @param compare 
     */
    public static keyOf(obj: object, compare: (value: any) => boolean): string;
    public static keyOf(obj: object, value: any): string;
    public static keyOf() {
        let obj = arguments[0];
        let value = arguments[1];
        if (obj instanceof Object) {
            for (const key in obj) {
                if (typeof value === "function") {
                    if (value(obj[key])) {
                        return key;
                    }
                }
                else {
                    if (obj[key] === value) {
                        return key;
                    }
                }
            }
            return null;
        }
        else {
            throw new Error('第一个参数中必须为对象类型');
        }
    }

    public static isEmptyObject(object: object): boolean {
        for (const _key in object) {
            return false;
        }
        return true;
    }

    public static clear(object: object): boolean {
        let keys = Object.keys(object);
        for (const key of keys) {
            delete object[key];
        }
        if (this.isEmptyObject(object)) return true;
        return false;
    }

    public static cloneObject<T>(obj: T): T {
        if (obj === null) {
            return obj;
        }
        if (typeof obj !== 'object' && typeof obj !== 'function') {
            return obj;
        }

        let tempObj;
        if (Array.isArray(obj)) {
            tempObj = [];
        }
        else if (typeof obj === 'function') {
            tempObj = function() {}
        }
        else {
            tempObj = {};
        }
        for (const k in obj) {
            if (Object.hasOwnProperty(k)) {
                (tempObj as T)[k] = (typeof obj[k] === 'object' || typeof obj[k] === 'function') ? this.cloneObject(obj[k]) : obj[k];
            }
        }
        return tempObj as T;
    }

    /**
     * 打乱数组次序
     * @param list 
     */
    public static disruptOrder(list: any[]) {
        let len: number = list.length;
        let flag: boolean = false;
        if (list.length >= 50) {
            flag = true;
            if (list.length %2 === 0) {
                len = list.length / 2;
            }
            else {
                len = Math.ceil(list.length / 2);
            }
        }
        
        for (let i: number = 0; i < len; ++i) {
            //数组随机索引
            let index: number = CCMathUtil.randomInt(0, list.length - 1);
            if (flag) {
                //数组后半段随机索引
                let halfIndex: number = CCMathUtil.randomInt(len, list.length - 1);
                let temp: any = list[i];
                list[i] = list[index];
                list[index] = list[halfIndex];
                list[halfIndex] = temp;
            }
            else {
                let temp: any = list[i];
                list[i] = list[index];
                list[index] = temp;
            }
        }
    }

    /**
     * 删除数组元素
     * @param deleteIndexs 需要删除的数组下标
     * @param list         需要删除的数组
     */
    public static removeArray(deleteIndexs: number[]|number, list: any[]) {
        if (typeof deleteIndexs === 'number') {
            let temp = deleteIndexs;
            deleteIndexs = [temp];
        }
        for (let index of deleteIndexs) {
            if (index >= list.length || index < 0) {
                throw Debug.error(`需要删除的下标${index}不合理`);
            }
            list[index] = undefined;
        }
        if (deleteIndexs.length === list.length) {
            list.length = 0;
            return;
        }
        let illegetIndexs: number[] = [];
        let rearIndex: number = 0;
        for (let i: number = deleteIndexs[0]; i < list.length; ++i) {
            if (list[i] === undefined) {
                illegetIndexs.push(i);
            }
            else if (rearIndex < illegetIndexs.length) {
                list[illegetIndexs[rearIndex]] = list[i];
                list[i] = undefined;
                illegetIndexs.push(i);
                rearIndex++;
            }
        }
        let len: number = list.length - deleteIndexs.length;
        for (let i: number = len; i < list.length; ++i) {
            delete list[i];
        }
        list.length = len;
    }

    /**
     * 冒泡排序
     * @param list 
     * @param compare 
     */
    public static bubbleSort<T>(list: T[], compare: (a: T, b: T) => number) {
        for (let i = 0; i < list .length; ++i) {
            for (let j = i + 1; j < list.length; ++j) {
                if (compare(list[i], list[j]) > 0) {
                    let temp = list[i];
                    list[i] = list[j];
                    list[j] = temp;
                }
            }
        }
    }

    /**
     * 快速排序
     * @param list 
     * @param comapre 
     */
    public static quickSort<T>(list: T[], comapre: (a: T, b: T) => number) {
        const left: number[] = [], right: number[] = [];
        left.push(0);
        right.push(list.length - 1);
        for (let index = 0; index < left.length; ++index) {
            const start = left[index];
            const len = right[index];
            if (start < len) {
                let i = start;
                let j = len;
                const temp = list[i];
                for (; j > i; --j) {
                    if (comapre(temp, list[j]) > 0) {
                        list[i] = list[j];
                        //找到大于基准元素temp的值的元素的位置（即不符合比较条件的元素所在的位置）
                        while(comapre(temp, list[i]) > 0 && i < j) {
                            i++;
                        }
                        list[j] = list[i];
                    }
                }
                list[i] = temp;
                left.push(start);
                right.push(i - 1);
                left.push(i + 1);
                right.push(len);
            }
        }
    }
}
