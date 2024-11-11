import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { FileContainer } from "./FileContainer";
import { JsonAsset } from "cc";
import { Res } from "../res/Res";
import { Assert } from "../exceptions/Assert";


/**
 * 配置表管理父类
 */
export class DataManager {
    private _file: cc_spark_file_data;
    constructor() {
        this._file = {};
    }

    private static _ins: DataManager = null;
    public static get instance(): DataManager {
        return this._ins = this._ins ? this._ins : new DataManager();
    }

    public get file() { return this._file; }

    /**
     * 加载配置表数据
     * @param path 配置表本地目录的路径
     * @param nameOrUrl 资源包名或者路径
     * @param onComplete 加载成功回调
     */
    public loadJSONTable(path: string, nameOrUrl: string, onComplete?: Function): void;
    public loadJSONTable(path: string, onComplete?: Function): void;
    public loadJSONTable() {
        if (typeof arguments[1] === 'string') {
            const path = arguments[0];
            const nameOrUrl = arguments[1];
            const onComplete = arguments[2];
            Res.createLoader(nameOrUrl).then(loader => {
                loader.loadDir(path, JsonAsset, (err, assets: JsonAsset[]) => {
                    if (err) {
                        Debug.error("配置表加载失败", err);
                        return;
                    }
                    for (const asset of assets) {
                        let jsonData = asset.json;
                        this.initFileData(jsonData);
                    }
                    SAFE_CALLBACK(onComplete);
                });
            }).catch(e => {
                Debug.error("加载配置表失败", e);
            });
        }
        else {
            const path = arguments[0];
            const onComplete = arguments[1];
            Res.loader.loadDir(path, JsonAsset, (err, assets: JsonAsset[]) => {
                if (err) {
                    Debug.error('配置表加载失败', err);
                    return;
                }
                for (const asset of assets) {
                    let jsonData = asset.json;
                    this.initFileData(jsonData);
                }
                SAFE_CALLBACK(onComplete);
            });
        }
    }

    private initFileData(data: any) {
        for (let key in data) {
            this.parserJSONData(data[key], key);
        }
    }

    private readAsObject(filename: string, fileContainer: FileContainer<any>): void {
        this._file[filename] = fileContainer;
        Object.defineProperty(this, filename, {
            get() {
                return fileContainer;
            }
        })
    }

    private parserJSONData(data: any, filename: string) {
        const flag = data !== null && (Array.isArray(data) || typeof data === "object");
        if (Assert.handle(Assert.Type.ConfigDataException, flag)) {
            const fileContainer = new FileContainer(data);
            this.readAsObject(filename, fileContainer);
        }
    }
}