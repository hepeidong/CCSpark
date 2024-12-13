import { Asset } from "cc";
import { SAFE_CALLBACK } from "../Define";
import { IAssetRegister, ILoader } from "../lib.zest";

export class AssetRegister implements IAssetRegister {
    private _haveVersion: boolean;
    private _version: string;
    private _filePaths: string[];
    private _dirPaths: string[];
    private _finish: number;
    private _dirWeight: number;
    private _total: number;
    private _dirAssets: Asset[];
    private _loader: ILoader;
    private _onProgress: (progress: number) => void;
    constructor() {
        this._haveVersion = false;
        this._filePaths = [];
        this._dirPaths  = [];
        this._finish    = 0;
        this._total     = 0;
        this._dirWeight = 0;
        this._dirAssets = [];
    }

    public get haveVersion() { return this._haveVersion; }
    public get version() { return this._version; }
    public get filePaths() { return this._filePaths; }
    public set dirPaths(paths: string[]) {
        this._dirPaths = paths;
    }
    public get dirPaths() { return this._dirPaths; }

    public reset() {
        this._finish    = 0;
        this._total     = 0;
        this._dirWeight = 0;
        this._filePaths.splice(0, this._filePaths.length);
        this._dirPaths.splice(0, this._dirPaths.length);
        this._dirAssets.splice(0, this._dirAssets.length);
    }

    public setVersion(version: string) {
        this._version = version;
        this._haveVersion = true;
    }

    public addFilePath(path: string) {
        this._filePaths.push(path);
    }

    public addDirPath(path: string) {
        this._dirPaths.push(path);
    }

    public setLoader(loader: ILoader) {
        this._loader = loader;
    }

    public loadAssets(onProgress: (progress: number) => void) {
        this._onProgress = onProgress;
        return new Promise<Asset[]>((resolve, rejects) => {
            //如果没有资源需要加载，则直接结束加载资源的回调，返回空数组
            if (this._filePaths.length === 0 && this._dirPaths.length === 0) {
                resolve([]);
            }
            else {
                let weight: number = 0;
                let currentWeight: number = 0;
                let result: Asset[] = [];
                if (this._filePaths.length > 0) {
                    weight++;
                    this._total++;
                    this.loadFile().then(assets => {
                        currentWeight++;
                        result = result.concat(assets);
                        if (currentWeight === weight) {
                            resolve(result);
                        }
                    }).catch(err => {
                        rejects(err);
                    });
                }
                if (this._dirPaths.length > 0) {
                    weight++;
                    this._total += this._dirPaths.length;
                    this.loadDir().then(assets => {
                        currentWeight++;
                        result = result.concat(assets);
                        if (currentWeight === weight) {
                            resolve(result);
                        }
                    }).catch(err => {
                        rejects(err);
                    });
                }
            }
        }) ;
    }

    private loadFile() {
        return new Promise<Asset[]>((resolve, rejects) => {
            this._loader.load(this._filePaths, (finish: number, total: number) => {
                this._finish += finish;
                SAFE_CALLBACK(this._onProgress, this.getProgress(finish, total));
            }, (err, assets) => {
                if (err) {
                    rejects(err);
                    return;
                }
                resolve(assets);
            });
        });
    }

    private loadDir() {
        return new Promise<Asset[]>((resolve, reject) => {
            for (const path of this._dirPaths) {
                this.loadAssetSync(path).then(assets => {
                    this._dirWeight++;
                    this._dirAssets = this._dirAssets.concat(assets);
                    if (this._dirWeight === this._dirPaths.length) {
                        resolve(this._dirAssets);
                    }
                }).catch(err => {
                    reject(err);
                });
            }
        });
    }

    private loadAssetSync(path: string) {
        return new Promise<Asset[]>((resolve, reject) => {
            this._loader.loadDir(path, (finish, total) => {
                this._finish += finish;
                SAFE_CALLBACK(this._onProgress, this.getProgress(finish, total));
            }, (err: Error, asset: Asset[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(asset);
            });
        });
    }

    private getProgress(finish: number, total: number) {
        this._finish += (total > 0 ? finish / total : 0);
        return this._finish / this._total;
    }
}
