
export type Encode = {
    byteLength: number;
    encode: string[];
}

export interface IAlgorithm {
    createCryptoKey(type?: string): Promise<void>;
    encrypt(data: string): Promise<Encode>;
    decrypt(encode: Encode): Promise<string>;
}

export abstract class EncryptAlgorithm<T = any> implements IAlgorithm {
    protected iv: Uint8Array;
    protected secretkey: T;//用于加密和解密的密钥，这是私有密钥，不能暴露
    
    constructor() {
        
    }

    abstract createCryptoKey(type?: string): Promise<void>;


    encrypt(data: string): any {
        return null;
    }

    decrypt(encode: Encode): any {
        return null;
    }

    private uint8ArrayToString(array: Uint8Array) {
        var out: string, i: number, len: number, c: number;
        var char2: number, char3: number;
        out = "";
        len = array.length;
        i = 0;
        while (i < len) {
            c = array[i++];
            switch (c >> 4) {
                case 0: 
                case 1: 
                case 2: 
                case 3: 
                case 4: 
                case 5: 
                case 6: 
                case 7:
                    // 0xxxxxxx
                    out += String.fromCharCode(c);
                    break;
                case 12: case 13:
                    // 110x xxxx 10xx xxxx
                    char2 = array[i++];
                    out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                    break;
                case 14:
                    // 1110 xxxx 10xx xxxx 10xx xxxx
                    char2 = array[i++];
                    char3 = array[i++];
                    out += String.fromCharCode(((c & 0x0F) << 12) |
                        ((char2 & 0x3F) << 6) |
                        ((char3 & 0x3F) << 0));
                    break;
            }
        }
        return out;
    }

    //字符串转ArrayBuffer
    protected stringToArrayBuffer(str: string) {
        var bytes = new Array();
        var len: number, c: number;
        len = str.length;
        for (var i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            if (c >= 0x010000 && c <= 0x10FFFF) {
                bytes.push(((c >> 18) & 0x07) | 0xF0);
                bytes.push(((c >> 12) & 0x3F) | 0x80);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if (c >= 0x000800 && c <= 0x00FFFF) {
                bytes.push(((c >> 12) & 0x0F) | 0xE0);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if (c >= 0x000080 && c <= 0x0007FF) {
                bytes.push(((c >> 6) & 0x1F) | 0xC0);
                bytes.push((c & 0x3F) | 0x80);
            } else {
                bytes.push(c & 0xFF);
            }
        }

        const array = new Int8Array(bytes.length);
        for (var i = 0; i <= bytes.length; i++) {
            array[i] = bytes[i];
        }
        return array;
    }

    //ArrayBuffer转字符串
    protected arrayBufferToString(buffer: ArrayBuffer) {
        const uint = new Uint8Array(buffer);
        return this.uint8ArrayToString(uint);
    }

    protected generateIv(len: number) {
        // 解密时也需要使用 iv
        return crypto.getRandomValues(new Uint8Array(len));
    }

    protected encodeToUint8Array(encode: Encode) {
        const debuffer = new Uint8Array(encode.byteLength);
        for (let i = 0; i < encode.encode.length; ++i) {
            debuffer[i] = parseInt(encode.encode[i]);
        }
        return debuffer;
    }

    protected arrayBufferToEncode(enbuffer: ArrayBuffer) {
        const uintArray = new Uint8Array(enbuffer);
        const bianry = uintArray.toString();
        const encode: Encode = {byteLength: enbuffer.byteLength, encode: bianry.split(",")}
        return encode;
    }
}