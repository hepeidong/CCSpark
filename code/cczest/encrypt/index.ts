import { js } from "cc";
import { Encode, IAlgorithm } from "./EncryptAlgorithm";
import { Md5 } from "./md5";

/**一般用于单机游戏本地数据加密 */
export class encrypt {
    public static getMd5(str: string) {
        return Md5.instance.getMd5(str);
    }

    private static _algorithm: IAlgorithm;
    public static async initEncrypt(type: encrypt.Type) {
        const classRef = js.getClassByName(type);
        this._algorithm = new classRef() as IAlgorithm;
        await this._algorithm.createCryptoKey(type);
    }

    /**
     * 数据加密
     * @param data 需要加密的字符串数据
     * @returns 
     */
    public static async encrypt(data: string) {
        return this._algorithm.encrypt(data);
    }

    /**
     * 数据解密
     * @param encode 需要加密的字符串数据
     * @returns 
     */
    public static async decrypt(encode: Encode) {
        return this._algorithm.decrypt(encode);
    }
}

export namespace encrypt {
    /**加密算法类型 */
    export enum Type {
        AES_CBC = "AESCBC",
        AES_CTR = "AESCTR",
        AES_GCM = "AESGCM",
        RSA_OAEP = "RSAOAEP"
    }
}