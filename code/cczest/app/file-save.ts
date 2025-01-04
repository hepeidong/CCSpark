import { native, sys } from "cc";
import { Debug } from "../Debugger";
import { STARTUP } from "../Define";
import { Assert } from "../exceptions/Assert";
import { UUID } from "../utils";
import { CCGameWorld } from "./CCGameWorld";
import { IDocument } from "zest";

type Archive = {archive: string, uuid: string}
interface FileTable {[n: string]: string; }

class FileIO {
    constructor() {

    }

    public static read(path: string) {
        try {
            if (sys.isNative) {
                const data = native.fileUtils.getStringFromFile(this.pathJoin(path));
                if (typeof data === "string") {
                    return data;
                }
                return "";
            }
            else {
                const data = sys.localStorage.getItem(path);
                if (typeof data === "string") {
                    return data;
                }
                return "";
            }
        } catch (error) {
            Debug.error("无法读取存档数据:", error);
            return "";
        }
    }

    public static write(path: string, data: string) {
        try {
            if (sys.isNative) {
                return native.fileUtils.writeStringToFile(data, this.pathJoin(path));
            }
            else {
                sys.localStorage.setItem(path, data);
                return true;
            }
        } catch (error) {
            Debug.error("无法写入存档数据", error);
            return false;
        }
    }

    public static remove(path: string) {
        try {
            if (sys.isNative) {
                return native.fileUtils.removeFile(this.pathJoin(path));
            }
            else {
                sys.localStorage.removeItem(path);
                return true;
            }
        } catch (error) {
            Debug.error("无法删除存档数据", error);
            return false;
        }
    }

    public static existFile(path: string) {
        const data = this.read(path);
        return data && data.length > 0;
    }

    private static pathJoin(path: string) {
        return "./" + path + ".json";
    }
}

class DataTable {
    private _uuid: string;
    private _fileTable: FileTable;
    constructor(uuid: string) {
        this._uuid = uuid;
        this.init(uuid);
    }


    private init(uuid: string) {
        const data = FileIO.read(uuid);
        if (data) {
            if (data.length > 0) {
                this._fileTable = JSON.parse(data);
            }
            else this._fileTable = {};
        }
        else this._fileTable = {};
    }

    public exist(filename: string) {
        return filename in this._fileTable;
    }

    public addFile(filename: string) {
        const uuid = UUID.randomUUID();
        this._fileTable[filename] = uuid;
        FileIO.write(this._uuid, JSON.stringify(this._fileTable));
    }


    public read(filename: string) {
        if (filename in this._fileTable) {
            const uuid = this._fileTable[filename];
            const data = FileIO.read(uuid);
            if (data.length > 0) {
                return JSON.parse(data);
            }
        }
        return null;
    }

    public save() {
        const fileTable = this._fileTable;
        for (const key in fileTable) {
            if (CCGameWorld.instance.hasProxy(key)) {
                const proxy = CCGameWorld.instance.retrieveProxy(key) as IDocument;
                if (!proxy.save()) {
                    return false;
                }
            }
            else {
                Debug.error("名为" + key + "的Document的子类是没有注册的！");
                return false;
            }
        }
        return true;
    }

    public write(filename: string, data: any) {
        if (filename in this._fileTable) {
            const uuid = this._fileTable[filename];
            return FileIO.write(uuid, JSON.stringify(data));
        }
        else {
            const uuid = UUID.randomUUID();
            this._fileTable[filename] = uuid;
            return FileIO.write(uuid, JSON.stringify(data));
        }
    }

    public remove() {
        const fileTable = this._fileTable;
        for (const key in fileTable) {
            if (!FileIO.remove(fileTable[key])) {
                return false;
            }
        }
        return true;
    }
}

export class DataSave {
    private _uuid: string;
    private _filename: string;
    private _archives: Archive[];
    private _dataTable: DataTable;
    constructor() {
        this._filename = STARTUP.name + "_save";
        this._archives = [];
    }

    private static _instance: DataSave = null;
    public static get instance() {
        if (!this._instance) {
            this._instance = new DataSave();
        }
        return this._instance;
    }

    private writeArchives() {
        return FileIO.write(this._filename, JSON.stringify(this._archives));
    }

    public getArchiveLength() {
        return this._archives.length;
    }

    /**
     * 获取所有的存档信息
     * @returns 返回包含所有存档的数组
     */
    public getArchives<T>() {
        const result: T[] = [];
        for (const archive of this._archives) {
            result.push(JSON.parse(archive.archive));
        }
        return result;
    }

    /**
     * 返回当前正在使用的存档基本信息
     * @returns 
     */
    public getCurrentArchive<T>() {
        return this._archives.find(item => item.uuid === this._uuid) as T;
    }

    public init() {
        if (FileIO.existFile(this._filename)) {
            const data = FileIO.read(this._filename);
            this._archives = JSON.parse(data);
        }
    }

    /**
     * 打开指定索引的存档记录，只有调用此函数，存档数据才能被使用
     * @param index 
     */
    public openArchive(index: number) {
        const flag = index < this._archives.length;
        if (Assert.handle(Assert.Type.ArrayIndexException, flag, "_archives")) {
            this._uuid = this._archives[index].uuid;
            this._dataTable = new DataTable(this._uuid);
        }
    }

    /**
     * 创建新的存档记录
     * @param archiveInfo 该存档的说明信息，例如存档名，日期之类的，用于显示的一些信息标识
     */
    public createArchive(archiveInfo: object) {
        this._uuid = UUID.randomUUID();
        const archives: Archive = {archive: JSON.stringify(archiveInfo), uuid: this._uuid};
        this._archives.push(archives);
        return this.writeArchives();
    }

    /**
     * 保存所有存档数据
     * @returns 返回是否保存成功
     */
    public save() {
        return this._dataTable.save();
    }

    public addFile(filename: string) {
        this._dataTable.addFile(filename);
    }

    public read(filename: string) {
        if (this._dataTable) {
            return this._dataTable.read(filename);
        }
        else {
            Debug.error("有存档数据或者使用了存档功能，但没有打开任何一个存档记录，无法读取存档数据");
        }
        return null;
    }

    public write(filename: string, data: any) {
        if (this._dataTable) {
            return this._dataTable.write(filename, data);
        }
        else {
            Debug.error("有存档数据或者使用了存档功能，但没有打开任何一个存档记录，无法写入存档数据");
        }
        return false;
    }

    public exist(filename: string) {
        return this._dataTable.exist(filename);
    }

    /**
     * 存档数据替换位置
     * @param index1 需要交换的索引位置
     * @param index2 需要交换的索引位置
     */
    public swapArchive(index1: number, index2: number) {
        const flag = index1 < this._archives.length && index2 < this._archives.length;
        if (Assert.handle(Assert.Type.ArrayIndexException, flag, "_archives")) {
            this._archives[index2] = this._archives.splice(index1, 1, this._archives[index2])[0];
        }
    }

    /**
     * 存档数据索引向下移动一个位置
     * @param index 
     */
    public archiveIndexDown(index: number) {
        const flag = index < this._archives.length - 1;
        if (Assert.handle(Assert.Type.ArrayIndexException, flag, "_archives")) {
            this.swapArchive(index, index + 1);
        }
    }

    /**
     * 删除指定索引的存档数据
     * @param index 存档的索引
     * @returns 
     */
    public remove(index: number) {
        const flag = index < this._archives.length;
        if (Assert.handle(Assert.Type.ArrayIndexException, flag, "_archives")) {
            const archive = this._archives[index];
            if (archive.uuid === this._uuid) {
                if (this._dataTable.remove()) {
                    this._archives.splice(index, 1);
                    return this.writeArchives();
                }
            }
            else {
                const uuid = this._archives[index].uuid;
                const table = new DataTable(uuid);
                if (table.remove()) {
                    this._archives.splice(index, 1);
                    return this.writeArchives();
                }
            }
        }
        return false;
    }
}