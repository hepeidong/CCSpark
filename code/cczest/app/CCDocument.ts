import { IDocument } from "zest";
import { Proxy } from "../puremvc";
import { utils } from "../utils";
import { DataSave } from "./file-save";


/**
 * author: HePeiDong
 * 
 * name: 游戏数据模型类
 * 
 * description: 这是MVC中的Model模块，用于存储数据
 */
export class CCDocument<T> extends Proxy<T> implements IDocument {
    constructor(proxyName: string = null, data: any = null) {
        super(proxyName, data);
        this.init();
    }

    private get propKeys(): string[] { return this.data["_propKeys"]; }

    public getArchive() {
        const propKeys = this.propKeys;
        if (Array.isArray(propKeys)) {
            const archive = {};
            for (const key of propKeys) {
                archive[key] = this.data[key];
            }
            return archive;
        }
        return null;
    }

    /**
     * 保存当前存档数据
     * @returns 返回是否保存成功，如果返回false，在有存档数据需要保存时（存在被prop属性装饰器修饰的属性）， 则为保存失败，在没有存档数据需要保存时，则为无需保存存档数据
     */
    public save() {
        const archive = this.getArchive();
        if (!utils.isNull(archive)) {
            return DataSave.instance.write(this.getProxyName(), archive);
        }
        return false;
    }

    private init() {
        if (Array.isArray(this.propKeys)) {
            const archive = DataSave.instance.read(this.getProxyName()); 
            if (!utils.isNull(archive)) {
                for (const key in archive) {
                    this.data[key] = archive[key];
                }
            }
            else {
                if (!DataSave.instance.exist(this.getProxyName())) {
                    DataSave.instance.addFile(this.getProxyName());
                }
            }
        }
    }

    /**数据存档类对象创建后执行，不可外部调用，子类可重写该函数 */
    onCreate() {}
}