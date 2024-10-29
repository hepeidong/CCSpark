import { AESCBC } from "./AESCBC";
import { AESCTR } from "./AESCTR";
import { AESGCM } from "./AESGCM";
import { Encode, IAlgorithm } from "./EncryptAlgorithm";
import { RSAOAEP } from "./RSAOAEP";
import { Md5 } from "./md5";


const ENCRYPT_NAME = ["AES-CBC", "AES-CTR", "AES-GCM"];

export class Encrypt {
    public static getMd5(str: string) {
        return Md5.instance.getMd5(str);
    }

    private static _algorithm: IAlgorithm;
    public static initEncrypt(type: Encrypt.Type) {
        switch (type) {
            case Encrypt.Type.AES_CBC:
                this.createAES(type).then(key => {
                    this._algorithm = new AESCBC(key);
                });
                break;

            case Encrypt.Type.AES_CTR:
                this.createAES(type).then(key => {
                    this._algorithm = new AESCTR(key);
                });
                break;

            case Encrypt.Type.AES_GCM:
                this.createAES(type).then(key => {
                    this._algorithm = new AESGCM(key);
                });
                break;

            case Encrypt.Type.RSA_OAEP:
                this.createRSA().then(key => {
                    this._algorithm = new RSAOAEP(key);
                });
                break;
        
            default:
                break;
        }
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

    private static async createAES(type: Encrypt.Type) {
        const key = await crypto.subtle.generateKey(
            {
                name: ENCRYPT_NAME[type],
                length: 256,
            },
            true,
            ["encrypt", "decrypt"]
        );
        return key;
    }

    private static async createRSA() {
        const keyPair = await crypto.subtle.generateKey(
            {
              name: "RSA-OAEP",
              modulusLength: 2048,
              publicExponent: new Uint8Array([1, 0, 1]),
              hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
          );
        return keyPair;
    }
}

export namespace Encrypt {
    export enum Type {
        AES_CBC,
        AES_CTR,
        AES_GCM,
        RSA_OAEP
    }
}