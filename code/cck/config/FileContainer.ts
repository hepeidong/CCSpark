import { SAFE_CALLBACK } from "../Define";
import { ObjectUtil } from "../utils/ObjectUtil";


export class FileContainer<T> implements IContainer<T> {
    public _length: number;
    private _keys: any[];
    private _fields: cck_file_field_type<T>;

    constructor(data: any) {
        this._length = 0;
        this._keys = [];
        this._fields = {} as cck_file_field_type<T>;
        this.init(data);
    }

    public get keys(): number[]|string[] { return this._keys; }
    public get fields() { return this._fields; }
    public get length() { return this._length; }

    private init(data: any) {
        for (let key in data) {
            this.add(key, data[key]);
        }
    }

    private add(id: number|string, value: T): void {
        if (!this[id]) {
            this._length++;
        }
        this[id] = value;
        this._keys.push(id);
        if (ObjectUtil.isEmptyObject(this._fields)) {
            const keys = Object.keys(value);
            for (const key of keys) {
                this._fields[key] = key;
            }
        }
    }

    /**
     * 根据id获取配置表的数据
     * @param id 
     * @returns 返回对应的id的配置表对象
     */
    get(id: number|string): T {
        return this[id];
    }

    

    /**
     * 获取当前表中的这个字段的值的累加，只有这个字段数据类型为number时才有用
     * @param field 当前配置表字段名
     * @returns 返回这个字段在当前配置表中的值的累加，如果数据类型不是number，则返回null
     */
    getSumOf(field: string) {
        const value = this[this._keys[0]][field];
        if (typeof value === 'number') {
            let sum = 0;
            for (const key of this._keys) {
                sum += this[key][field];
            }
            return sum;
        }
        return null;
    }

    /**
     * 遍历当前配置表
     * @param callback 
     */
    forEach(callback: (value: T, index: number) => void): void {
        for (let i: number = 0; i < this._length; ++i) {
            let key = this._keys[i];
            SAFE_CALLBACK(callback, this[key], i);
        }
    }

    contains(id: number|string): boolean {
        return id in this;
    }
}
