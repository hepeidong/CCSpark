import { EncryptAlgorithm } from "./EncryptAlgorithm";

const ENCRYPT_NAME = {
    AESCBC: "AES-CBC", 
    AESCTR: "AES-CTR", 
    AESGCM: "AES-GCM"
}

export class AES extends EncryptAlgorithm<CryptoKey> {
    constructor() {
        super();
        this.iv = this.generateIv(16);
    }

    private async createAES(type: string) {
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

    public async createCryptoKey(type: string): Promise<void> {
        this.secretkey = await this.createAES(type);
    }
}