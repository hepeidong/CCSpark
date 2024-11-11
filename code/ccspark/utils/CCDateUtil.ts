import { cc_spark_utils_date_compare_type } from "../lib.ccspark";
import { CCStringUtil } from "./CCStringUtil";

interface DateFormatArgs {
    date: string;   //时间字符，格式为xxxx-xx-xxTxx:xx:xx
    tm: number;     //时间戳
    format: string; //时间日期表达格式
}

enum Scope {
    HOUR,
    MINUTE,
    SECOND,
    MILLISECOND
}

export  class CCDateUtil {
    public static readonly MILLISECOND: number = 1000;
    public static readonly ONE_SECOND: number  = 1;
    public static readonly ONE_MINUTE: number  = 60;
    public static readonly ONE_HOUR: number    = 3600;
    public static readonly ONE_DAY: number     = 86400;
    public static readonly ONE_MONTH: number   = 2592000;
    public static readonly ONE_YEAR: number    = 31102000;

    private static _scopeList: number[] = [3600 * 1000, 60 * 1000, 1000, 1];
    private static _cdLastMap: Map<string, number> = new Map();

    public static get Scope(): typeof Scope { return Scope; }

    public static inCD(internal: number, id: any = 0): boolean {
        let key: string = '$' + id.toString();
        let cdLastTime: number = this._cdLastMap.get(key);
        if (!cdLastTime) {
            this._cdLastMap.set(key, new Date().getTime());
            return false;
        }
        if (new Date().getTime() - cdLastTime > internal) {
            this._cdLastMap.set(key, new Date().getTime());
            return false;
        }
        return true;
    }

    /**
     * 计算并返回两个时间的时间差, 根据传入的时间间隔, 返回时间差, 如果第二个时间参数不传, 则默认与当前时间的时间差
     * @param interval 
     * @param date1 
     * @param date2 
     */
    public static dateDiff(interval: Scope, date1: Date, date2?: Date) {
        if (!date2) {
            return Math.floor(new Date().getTime() / this._scopeList[interval]) - Math.floor(date1.getTime() / this._scopeList[interval]);
        }
        else {
            return Math.floor(date1.getTime() / this._scopeList[interval]) - Math.floor(date2.getTime() / this._scopeList[interval]);
        }
    }

    /**
     * 比较两个日期, 传入两个时间戳
     * @param date1 
     * @param date2 
     */
    public static compareDate(time1: number, time2: number, compare: (a: cc_spark_utils_date_compare_type, b: cc_spark_utils_date_compare_type) => boolean) {
        let date1: Date = new Date(time1);
        let date2: Date = new Date(time2);
        
        let a: cc_spark_utils_date_compare_type = {year: date1.getFullYear(), month: date1.getMonth() + 1, date: date1.getDate(), hours: date1.getHours()};
        let b: cc_spark_utils_date_compare_type = {year: date1.getFullYear(), month: date2.getMonth() + 1, date: date2.getDate(), hours: date2.getHours()};
        return compare(a, b);
    }

    /**获取当天时间 */
    public static getTimeDay():number{
        let date = new Date();
        let time = date.getTime() / 1000 / 60 / 60 / 24;
        return Math.floor(time);
    }

    /**
     * 时间格式, 传入秒数, 构建 00:00:00 这种格式的时间字符串, 只适合 小时:分钟:秒 这种格式
     * @param second 秒
     * @param scope 时间显示范围, 默认最大是小时
     */
    public static timeFormat(second: number, scope: Scope = Scope.HOUR) {
        let minute: number = Math.floor(second / this.ONE_MINUTE);
        let hour: number = Math.floor(second / this.ONE_HOUR);
        let format: string[];
        if (scope === Scope.HOUR) {
            format = [this.timeStr(hour, 2), this.timeStr(minute, 2), this.timeStr(minute > 0 ? second%this.ONE_MINUTE : second, 2)];
        }
        else if (scope === Scope.MINUTE) {
            format = [this.timeStr(minute, 2), this.timeStr(minute > 0 ? second%this.ONE_MINUTE : second, 2)];
        }
        else if (scope === Scope.SECOND) {
            format = [this.timeStr(minute > 0 ? second%this.ONE_MINUTE : second, 2)];
        }
        return format.join(':');
    }

    
    /**
     * 时间格式
     * @param tm 时间戳
     */
    public static dateFormat(format: string, tm: number): string;
    public static dateFormat(tm: number): string;
    public static dateFormat(format: string): string;
    public static dateFormat(): string {
        let args: DateFormatArgs = this.makeArgs.apply(null, arguments);
        let now: Date;
        if (args === null || (args.tm === null && args.date === null)) {
            now = new Date();
        }
        else if (args.date) {
            now = new Date(args.date);
        }
        else if (args.tm) {
            now = new Date(args.tm);
        }

        const year: string = now.getFullYear().toString();
        const month: string = (now.getMonth() + 1).toString();
        const day: string = now.getDate().toString();
        const hours: string = this.timeStr(now.getHours(), 2);
        const minutes: string = this.timeStr(now.getMinutes(), 2);
        const seconds: string = this.timeStr(now.getSeconds(), 2);
        const milliseconds: string = this.timeStr(now.getMilliseconds(), 3);
        if (args === null || args.format === null || args.format === '') {
            if (args && args.date) {
                return this.normalFormat(year, month, day, null, null, null, null);
            }
            else {
                return this.normalFormat(year, month, day, hours, minutes, seconds, milliseconds);
            }
        }
        else {
            return CCStringUtil.format(args.format, year, month, day, hours, minutes, seconds, milliseconds);
        }
    }

    /**
    * 判断是否在某个时间内
    * @param  now 
    * @param  start
    * @param  end 
    */
    public static belongCalendar(now: Date, start: string, end: string): boolean {
        if (this.atStartTimeFrame(now, start)) {
            return this.outOfTime(now, end);
        }
        else {
            //还没到开始时间
            return false;
        }
    }

    private static timeStr(timeNum: number, len: number): string {
        const str: string = String(timeNum);
        const strLen: number = len - str.length;
        if (strLen < 0) {
            return str;
        }
        else {
            let tempStr: string = '';
            for (let i: number = 0; i < strLen; ++i) {
                tempStr += '0';
            }
            return `${tempStr}${str}`;
        }
    }

    private static makeArgs(): DateFormatArgs {
        if (arguments.length === 0) {
            return null;
        }
        let args: DateFormatArgs = { date: null, tm: null, format: null };
        for (let i: number = 0; i < arguments.length; ++i) {
            if (typeof arguments[i] === 'string') {
                let strArr: string[] = arguments[i].split('T');
                if (strArr.length === 2 && strArr[0].split('-').length === 3 && strArr[1].split(':').length === 3) {
                    args.date = arguments[i];
                }
                else {
                    args.format = arguments[i];
                }
            }
            else if (typeof arguments[i] === 'number') {
                args.tm = arguments[i];
            }
        }
        return args;
    }

    private static normalFormat(
        year: string,
        month: string,
        day: string,
        hours: string,
        minutes: string,
        seconds: string,
        milliseconds: string
    ): string {
        let dateList: string[] = [];
        if (year) dateList.push(year);
        if (month) dateList.push(month);
        if (day) dateList.push(day);
        let timeList: string[] = [];
        if (hours) timeList.push(hours);
        if (minutes) timeList.push(minutes);
        if (seconds) timeList.push(seconds);
        if (milliseconds) timeList.push(milliseconds);
        const date: string = dateList.join('-');
        const times: string = timeList.join(':');
        return `${date} ${times}`;
    }

    private static atStartTimeFrame(now: Date, start: string): boolean {
        if (!start) return;
        let startDateStrArr = start.split(' ');
        let startDate = startDateStrArr[0].split('-');
        let startYear = parseInt(startDate[0]);
        let startMonth = parseInt(startDate[1]);
        let startDay = parseInt(startDate[2]);
        let startTime = startDateStrArr[1].split(':');
        let startHours = parseInt(startTime[0]);
        let startMinutes = parseInt(startTime[1]);
        let startSeconds = parseInt(startTime[2]);

        if (now.getFullYear() >= startYear) {
            if ((now.getMonth() + 1) > startMonth) return true;
            else if ((now.getMonth() + 1) == startMonth && (now.getDate()) > startDay) return true;
            else if ((now.getDate()) == startDay && now.getHours() > startHours) {
                return true;
            }
            else if (now.getHours() == startHours && now.getMinutes() > startMinutes) {
                return true;
            }
            else if (now.getHours() == startHours && now.getMinutes() == startMinutes && now.getSeconds() >= startSeconds) {
                return true;
            }
            else {
                //还没到开始时间
                return false;
            }
        }
        else {
            //还没到开始时间
            return false;
        }
    }

    private static outOfTime(now: Date, end: string): boolean {
        let endDateStrArr = end.split(' ');
        let endDate = endDateStrArr[0].split('-');
        let endYear = parseInt(endDate[0]);
        let endMonth = parseInt(endDate[1]);
        let endDay = parseInt(endDate[2]);
        let endTime = endDateStrArr[1].split(':');
        let endHours = parseInt(endTime[0]);
        let endMinutes = parseInt(endTime[1]);
        let endSeconds = parseInt(endTime[2]);

        if (now.getFullYear() <= endYear) {
            if ((now.getMonth() + 1) < endMonth) return true;
            else if ((now.getMonth() + 1) == endMonth && (now.getDate()) < endDay) return true;
            else if ((now.getDate()) == endDay && now.getHours() < endHours) {
                return true;
            }
            else if (now.getHours() == endHours && now.getMinutes() < endMinutes) {
                return true;
            }
            else if (now.getHours() == endHours && now.getMinutes() == endMinutes && now.getSeconds() < endSeconds) {
                return true;
            }
            else {
                //超过了结束时间
                return false;
            }
        }
        else {
            //超过了结束时间
            return false;
        }
    }
}
