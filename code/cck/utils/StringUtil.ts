import { SHOW_DATE } from "../Define";
import { DateUtil } from "./DateUtil";
import { MathUtil } from "./MathUtil";

const SIMGLE: string[] = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const UNITS: string[] = ['十', '百', '千', '万', '十万', '百万', '千万', '亿', '十亿', '百亿', '千亿', '万亿'];
const SYMBOL: string[] = ['.', ':', '-', '_', '=', '|', '~', ',', ';'];
const RED_EXP: RegExp[] = [new RegExp(/./), new RegExp(/:/), new RegExp(/-/), new RegExp(/_/),
new RegExp(/=/), new RegExp(/|/), new RegExp(/~/), new RegExp(/,/), new RegExp(/;/)];

const NUM_FORMAT_LIST: Array<{units: string, ratio: number, max: number}> = [
    {units: 'k', ratio: 1000, max: 9999},
    {units: 'w', ratio: 10000, max: 99999},
    {units: 'm', ratio: 1000000, max: 9999999},
    {units: 'b', ratio: 1000000000, max: 9999999999},
    {units: 'A', ratio: 1000000000000, max: 9999999999999}
]

export  class StringUtil {

    /**
     * 取整后的数字格式，形式为 5十万这类
     * @param num 数字
     */
     public static numberFormat(num: number): string {
        let ret: string = '';
        if (num < NUM_FORMAT_LIST[0].ratio) {
            ret = num.toString();
        }
        else {
            let currUnits: number = 0;
            let currRatio: number = NUM_FORMAT_LIST[currUnits].ratio;
            for (const units of NUM_FORMAT_LIST) {
                if (num >= units.max) {
                    currRatio = units.ratio;
                    currUnits++;
                }
            }

            let p: number = num / currRatio;//数值除以单位的倍数，得到取整前的基础数值
            ret = Math.floor(p) + NUM_FORMAT_LIST[currUnits].units;
        }
        return ret;
    }

    /**
     * 格式化操作数字，结果为科学计数法
     * @param num 
     */
     public static decimalFormat(num: number): string {
        let temp: number = Math.round(num);
        let ret: string = '';
        let div: number = 1000;
        while (temp >= 1) {
            let remainder: number = temp % div;
            ret = remainder.toString() + (ret === '' ? ret : ',' + ret);
            temp = (temp - remainder) / div;
        }
        return ret;
    }

    /**
     * 把传入的数字转换为中文
     * @param format 
     * @param num 
     * @returns 这个数字的中文表述
     * @example
     * convertToChinese('%s元', 1200);//一千二百元
     */
    public static convertToChinese(format: string, num: number): string {
        const units: string[] = [];
        let unistIndex: number = -1;
        let lastRemainder: number = 0;
        while (num > 0) {
            let remainder: number = num%10;
            num = (num - remainder)/10;
            if (unistIndex > -1) {
                if (remainder > 0) {
                    units.unshift(UNITS[unistIndex]);
                    units.unshift(SIMGLE[remainder - 1]);
                }
                else {
                    if (lastRemainder > 0) {
                        units.unshift('零');
                    }
                }
            }
            else {
                remainder > 0 && units.unshift(SIMGLE[remainder - 1]);
            }
            lastRemainder = remainder;
            unistIndex++;
        }
        let result = units.join('');
        if (result === '一十') {
            result = '十';
        }
        else if (result === '一十万') {
            result = '十万';
        }
        return this.format(format, result);
    }

    /**
     * 日志格式
     * @param logTag 标签
     * @param type 日志类型
     */
    public static logFormat(logTag: string, type: string): string {
        if (SHOW_DATE) {
            return `${logTag ? `[${logTag}]` : ''}${DateUtil.dateFormat('%s-%s-%s %s:%s:%s:%s')} ${type}`;
        }
        return `${logTag ? `[${logTag}]` : ''} ${type}`;
    }

    /**
     * 连续替大括号{}内的字符
     * @param str 
     * @param replaceValue 
     * @returns 
     * @example
     * replaceBrace("{0}年级{1}班的王同学", "三", "5"); //返回的结果是"三年级5班的王同学"
     * 
     */
    public static replaces(str: string, ...replaceValue: any[]): string {
        for (let i: number = 0; i < replaceValue.length; ++i) {
            str = str.replace(/\{[^\}]+\}/, replaceValue[i]);
        }
        return str;
    }

    /**
     * 替换括号内的字符，会保留括号，默认替换{}内的字符
     * 注：只能替换{}、[]、()这三种括号内的字符
     * @param str 
     * @param replaceValue 
     * @param parentheses 需要替换的括号
     * @param isKeep 是否保留括号，默认是不保留
     * @returns 
     * @example
     * replace("这是一个{AA}", "BB", true, "{}"); //返回结果是"这是一个{BB}"
     */
    public static replace(str: string, replaceValue: string, isKeep: boolean = false, parentheses: string = "{}") {
        let exp: RegExp;
        if (parentheses === "{}") {
            exp = /\{[^\}]+\}/;
            replaceValue = isKeep? `{${replaceValue}}` : replaceValue;
        }
        else if (parentheses === "[]") {
            exp = /\[[^\)]*\]/g;
            replaceValue = isKeep? `[${replaceValue}]` : replaceValue;
        }
        else if (parentheses === "()") {
            exp = /\([^\)]*\)/g;
            replaceValue = isKeep? `(${replaceValue})` : replaceValue;
        }
        return str.replace(exp, replaceValue);
    }

    /**
     * 清除所有空格符号
     * @param str 
     * @returns 
     */
    public static clearAllSpace(str: string) {
        return str.replace(/ /g, "");
    }

    /**
     * 版本比较是否相同，不相同，则返回false
     * @param newV 新版本
     * @param oldV 旧版本
     */
    public static compareVersionSame(newV: string, oldV: string) {
        let oldVArr: string[] = oldV.split('.');
        let newVArr: string[] = newV.split('.');
        for (let i: number = 0; i < oldVArr.length; i++) {
            if (parseInt(newVArr[i]) !== parseInt(oldVArr[i])) {
                return false;
            }
        }
        return true;
    }

    /**
     * 比较版本大小, v1是否大于v2
     * @param v1 版本1
     * @param v2 版本2
     */
    public static compareVersion(v1: string, v2: string) {
        let v1Arr: string[] = v1.split('.');
        let v2Arr: string[] = v2.split('.');
        for (let i: number = 0; i < v1Arr.length; ++i) {
            if (parseInt(v1Arr[i]) > parseInt(v2Arr[i])) return true;
            else if (parseInt(v1Arr[i]) < parseInt(v2Arr[i])) return false;
            else continue;
        }
        return false;
    }

    public static contain(fromString: string, subString: string) {
        let start = fromString.indexOf(subString[0]);
        let end = fromString.indexOf(subString[subString.length - 1]);
        let len = end - start + 1;
        if (len !== subString.length) {
            return false;
        }
        let temp = '';
        for (let i: number = start; i <= end; ++i) {
            temp += fromString[i];
        }
        return temp === subString;
    }

    /**
     * 构建富文本格式字符串, 传入的参数格式为:这是=00ff00/富文本=0fffff, 颜色值不传,则默认白色
     * @param str 
     * @example 
     * buildRichText('这是=00ff00/富文本=0fffff'); //<color=#00ff00>这是</c><color=#0fffff>富文本</color>
     */
    public static buildRichText(str: string): string {
        let slt: string[] = str.split('/');
        let result: string = '';
        for (let e of slt) {
            let eSlt: string[] = e.split('=');
            result += '<color=#';
            if (eSlt.length === 1) {
                result += 'ffffff' + '>';
            }
            else if (eSlt.length === 2) {
                let last = eSlt.pop();
                result += last + '>';
            }
            for (let k in eSlt) {
                result = result + eSlt[k];
            }
            result += '</color>';
        }
        return result;
    }

    /**
     * 构建字符串格式
     * @param strFm 字符串格式
     * @param replaceValue 替换的值
     * @example
     * format('[%s-%s-%s]', 2020, 05, 01); //2020-05-01
     */
    public static format(strFm: string, ...replaceValue: any[]): string {
        let retStr: string = strFm;
        for (let i: number = 0; i < replaceValue.length; ++i) {
            if (replaceValue[i] !== null  && typeof replaceValue[i] !== "undefined") {
                retStr = retStr.replace(/%s/, replaceValue[i]);
            }
        }

        retStr = this.reverse(retStr);
        while (1) {
            if (retStr.indexOf('s') === -1 && retStr.indexOf('%') === -1) {
                break;
            }
            let index: number = retStr.indexOf('%');
            retStr = retStr.replace(/%/, '');
            retStr = retStr.replace(/s/, '');
            if (index === 0) {
                continue;
            }
            for (let k in SYMBOL) {
                if (SYMBOL[k] === retStr[index - 1]) {
                    retStr = retStr.replace(RED_EXP[k], '');
                    break;
                }
            }
        }
        return this.reverse(retStr);
    }

    //字符串取反
    private static reverse(str: string) {
        let temp1: string = '';
        let temp2: string = '';
        let hard: number = Math.floor(str.length / 2) - 1;
        let end: number = str.length - 1;

        if (str.length % 2 > 0) {
            temp2 += str[hard + 1];
        }

        while (1) {
            if (hard < 0) {
                break;
            }
            temp1 += str[end];
            temp2 += str[hard];
            hard--;
            end--;
        }
        return temp1 + temp2;
    }

    /**
     * 是否为空，空格也会被识别为有效字符
     * @param str 需要判空的字符串
     */
    public static isEmpty(str: string): boolean {
        if (typeof str === "string") {
            return str.length > 0 ? false : true;
        }
        throw new Error("参数不可以传入‘" + typeof str + "’类型！");
    }

    /**
     * 是否为真空值，空格会被判定为空值
     * @param str 
     * @returns 
     */
    public static isBlank(str: string) {
        if (typeof str === "string") {
            if (str.length > 0) {
                let i: number = 0;
                let p: string = ' ';
                while (p === ' ' && i < str.length) p = str[i++];
                return p !== ' ' ? false : true;
            }
            return true;
        }
        throw new Error("参数不可以传入‘" + typeof str + "’类型！");
    }

    /**
     * 是否有一个字符串是空字符串，空格也会被识别为有效字符
     * @param str 要判定的字符串
     * @returns 
     */
    public static isAnyEmpty(...str: any[]) {
        for (const s of str) {
            if (this.isEmpty(s)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 是否有一个字符为空字符串，空格会被判定为空值
     * @param str 
     * @returns 
     */
    public static isAnyBlank(...str: any[]) {
        for (const s of str) {
            if (this.isBlank(s)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取随机字符串
     * @param len 字符串长度
     * @returns 
     */
    public static randomString(len: number): string {
        let words: string = 'abcdefghijklmnopqrstuvwxyz';
        let str: string = '';
        for (let i: number = 0; i < len; i++) {
            let idx: number = MathUtil.randomInt(0, words.length);
            str += words.charAt(idx);
        }
        return str;
    }

    /**
     * 删除字符串中相邻的两个字符, 直到得出没有相邻字符的字符串
     * @param str 
     */
    public static removeDuplicates(str: string) {
        let index: number = 0;
        let stack: string[] = [];
        while(index < str.length) {
            if (stack.length > 0 && stack[stack.length - 1] === str.charAt(index)) {
                stack.pop();
            }
            else {
                stack.push(str.charAt(index));
            }
            ++index;
        }
        return stack.join('');
    }

    /**
     * 字符串是否以某个子字符结尾
     * @param parent 
     * @param child 
     */
    public static stringEndWith(parent: string, child: string): boolean {
        let reg: RegExp = new RegExp(child + "$");
        return reg.test(parent);
    }

    /**
     * 判断字符串是否有中文
     * @param str 
     */
    public static isChinese(str: string): boolean {
        let patrn = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;
        if (!patrn.exec(str)) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * 字符串截取，中英文都能用
     * @param str 被截取的字符串
     * @param start 开始位置
     * @param len 截取长度
     * @param dots 是否在后加附加省略号，默认是不加
     */
    public static cutOut(str: string, start: number, len: number, dots: boolean = false): string {
        let str_length: number = 0;
        let str_len: number = 0;
        let str_cut: string = '';
        str_len = str.length;
        for (let i: number = start; i < str_len; i++) {
            let a: string = str.charAt(i);
            str_length++;
            //中文字符经编码后长度大于4
            if (encodeURIComponent(a).length > 4) {
                str_length++;
            }
            str_cut = str_cut.concat(a);
            if (str_length >= len) {
                if (dots) str_cut = str_cut.concat("...");
                return str_cut;
            }
        }
        //被截取的字符串str小于要截取的长度
        return str;
    }

    /**
     * 字符串长度，会自动把中文转化为字符计算
     * @param str 
     */
    public static getLen(str: string): number {
        return this.getStringLen(str, (s: string) => {
            if (encodeURIComponent(s).length > 4) {
                return 2;
            }
            else return 1;
        })
    }

    /**
     * 获取引擎标签Label字符长度
     * @param str 
     */
    public static getLabelLen(str: string): number {
        return this.getStringLen(str, (s: string) => {
            if (escape(s).length > 4) {
                return 1;
            }
            else return 0.5;
        });
    }

    private static getStringLen(str: string, countFn: (s: string) => number): number {
        let str_length: number = 0;
        let str_len: number = 0;
        str_len = str.length;
        for (let i: number = 0; i < str_len; i++) {
            let a: string = str.charAt(i);
            str_length += countFn(a);
        }
        return str_length;
    }

    // 浏览器下取得当前的 urlparam
    public static getURLParams(): any {
        const params = {};
        if (window.location == null) {
            return params;
        }
        let name: string;
        let value: string;
        let str = window.location.href; // 取得整个地址栏
        let num = str.indexOf('?');
        str = str.substring(num + 1); // 取得所有参数 

        const arr = str.split('&'); // 各个参数放到数组里
        for (let i = 0; i < arr.length; i++) {
            num = arr[i].indexOf('=');
            if (num > 0) {
                name = arr[i].substring(0, num);
                value = arr[i].substring(num + 1);
                params[name] = value;
            }
        }
        return params;
    }
}
