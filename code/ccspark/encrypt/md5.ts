export class Md5 {
    private static _ins: Md5;
    public static get instance(): Md5 {
        return this._ins || (this._ins = new Md5());
    }
    public getMd5(str: string): string {
        return this.md5(str);
    }

    private split(target: string | any[], step: number, markString: boolean = typeof target === "string") {
        if (typeof target === "string") target = target.split("");
        let result: any[] = target.map(
            (_, index: number) =>
                index % step === 0
                    ? Array.from(Array(step).keys()).map((x: number) => target[index + x])
                    : []
        )
            .filter((x: any[]) => x.length > 0);
        if (markString)  {
            result = result.map((x: any[]) => x.join(""));
        }
        return result;
    }

    private padding(str: string | any[], length: number, char: string, tail: boolean = true, isArray: boolean = Array.isArray(str)) {
        let arr: any[];
        if (Array.isArray(str)) {
            arr = str;
        } else {
            arr = str.split("");
        }
        const paddingStr: any[] = this.range(length - str.length).map(() => char);
        const result = tail ? arr.concat(paddingStr) : paddingStr.concat(arr);
        return isArray ? result : result.join("");
    }

    private little_endian(charCode: number) {
        return this.split(this.padding(charCode.toString(16), 8, "0", false), 2).reverse().join("");
    }

    private range(...args: number[]) {
        const start: number = args.length === 1 ? 0 : args[0];
        const end: number = args.length === 2 ? args[1] : args[0] - 1;
        return Array.from(Array(end - start + 1).keys()).map((x: number) => x + start);
    }

    private toBinary(code: number, bit: number = 8, max: number = Math.pow(2, bit) - 1) {
        if (code < 0) throw new Error("code 值大于: 0");
        if (code > max) throw new Error("code 应小于: " + max);
        return this.padding(code.toString(2), bit, "0", false);
    }

    private toHex(code: number, bit: number = 8, max: number = Math.pow(16, bit) - 1) {
        if (code < 0) throw new Error("code 应大于: 0");
        if (code > max) throw new Error("code 应小于: " + max);
        return this.padding(code.toString(16), bit, "0", false);
    }

    private toCode(str: string) {
        if (str.substr(0, 2).toLowerCase() === "0b") return parseInt(str.substr(2, 8), 2);
        if (str.substr(0, 2).toLowerCase() === "0x") return parseInt(str.substr(2, 8), 16);
    }

    private utf16ToUtf8(str: string) {
        return str.split("").map((char: string) => this.utf8Encode(char)).join("");
    }

    private utf8Encode(char: string) {
        let utftext = "";
        const c = char.charCodeAt(0);
        if (c < 128) {
            utftext += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 0b11000000);
            utftext += String.fromCharCode((c & 0b00111111) | 0b10000000);
        } else {
            utftext += String.fromCharCode((c >> 12) | 0b11100000);
            utftext += String.fromCharCode(((c >> 6) & 0b00111111) | 0b10000000);
            utftext += String.fromCharCode((c & 0b00111111) | 0b10000000);
        }
        return utftext;
    }

    private uintAdd(...args: number[]) {
        const t = Uint32Array.from([0]);
        const x = Uint32Array.from(args);
        x.forEach(n => t[0] = t[0] + n);
        return t[0];
    }

    private loopShiftLeft(n: number, bits: number) {
        return (n << bits) | (n >>> (32 - bits));
    }

    private A = 0x67452301;
    private B = 0xefcdab89;
    private C = 0x98badcfe;
    private D = 0x10325476;

    private F(b: number, c: number, d: number) {
        return (b & c) | (~b & d);
    }

    private G(b: number, c: number, d: number) {
        return (b & d) | (c & ~d);
    }

    private H(b: number, c: number, d: number) {
        return b ^ c ^ d;
    }

    private I(b: number, c: number, d: number) {
        return c ^ (b | ~d)
    }

    private S = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
        5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
        4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
        6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];

    private T(i: number) {
        return Math.floor(Math.pow(2, 32) * Math.abs(Math.sin(i + 1)));
    }

    private xIndex(i: number) {
        if (i >= 0 && i <= 15) return i;
        if (i >= 16 && i <= 31) return (5 * i + 1) % 16;
        if (i >= 32 && i <= 47) return (3 * i + 5) % 16;
        if (i >= 48 && i <= 63) return (7 * i) % 16;
        return 0;
    }

    private wrap(m: any) {
        return (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
            // 循环左移
            return this.uintAdd(this.loopShiftLeft(this.uintAdd(a, m(b, c, d), x, t), s), b);
        };
    }

    private porcessMessage(str: string) {
        const length = str.length;
        const length_of_zero = Math.ceil(length / 64) * 64 - length - 8 - 1;
        str += String.fromCharCode(0b10000000);
        const strArray = this.padding(str.split(""), length + 1 + length_of_zero, String.fromCharCode(0));
        const tail = this.split(this.padding(this.toBinary(length * 8 % Math.pow(2, 64)), 64, "0"), 8).map(x => parseInt(x, 2));
        const head = (strArray as any[]).map(x => x.charCodeAt(0));
        return Uint32Array.from(
            this.split(head.concat(tail), 4)
                .map(x =>
                    x.map((t: number) => this.padding(t.toString(16), 2, "0", false)).join("")
                )
                .map(x => parseInt(x, 16))
                .map(x => parseInt(this.little_endian(x), 16))
        )
    }

    private fghi(i: number) {
        if (i >= 0 && i <= 15) return this.F;
        if (i >= 16 && i <= 31) return this.G;
        if (i >= 32 && i <= 47) return this.H;
        if (i >= 48 && i <= 63) return this.I;
    }

    private fghiWrapped(i: number) {
        return this.wrap(this.fghi(i));
    }

    private md5(str: string) {
        str = this.utf16ToUtf8(str);
        const uint32_array = this.porcessMessage(str);
        const result = Uint32Array.from([this.A, this.B, this.C, this.D]);
        const chunks = this.split(Array.from(uint32_array), 16);
        for (const chunk of chunks) {
            const a = result[0];
            const b = result[1];
            const c = result[2];
            const d = result[3];
            for (let i = 0; i < 64; i++) {
                result[(4 - i % 4) % 4] = this.fghiWrapped(i)(result[(4 - i % 4) % 4], result[((4 - i % 4) + 1) % 4], result[((4 - i % 4) + 2) % 4], result[((4 - i % 4) + 3) % 4], chunk[this.xIndex(i)], this.S[i], this.T(i))
            }
            result[0] = a + result[0];
            result[1] = b + result[1];
            result[2] = c + result[2];
            result[3] = d + result[3];
        }
        return Array.from(result).map(x => this.little_endian(x)).join("").toLowerCase();
    }
}
