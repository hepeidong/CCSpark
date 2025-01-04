import { misc } from "cc";
import { v2 } from "cc";
import { Vec2 } from "cc";
import { Vec3 } from "cc";

export  class CCMathUtil {

    /**
     * 四舍五入，保留小数点后几位
     * @param num 
     * @param keep 保留小数点的位数，默认是0，即不保留小数点
     * @returns 
     */
    public static round(num: number, keep: number = 0): number {
        let multiple: number = 1;
        while (keep-- > 0) multiple = multiple * 10;
        num = num * multiple;
        return Math.round(num) / multiple;
    }

    /**
     * 取随机数，结果是一个小数
     * @param min 
     * @param max 
     * @returns 
     */
    public static random(min: number, max: number): number {
        var delta = max - min;
        var rand = Math.random();
        return (min + rand * delta);
    }

    /**
     * 取随机数，结果是一个整数
     * @param min 
     * @param max 
     * @returns 
     */
    public static randomInt(min: number, max: number): number {
        return Math.round(this.random(min, max));
    }

    /**
     * 生成不重复的随机数
     * @param min 最小值
     * @param max 最大值
     * @param numberCount 获取随机数的个数
     * @returns 
     */
    public static randomNonRepeat(min: number, max: number, numberCount?: number): number[] {
        return this.getRandomNonRepeat(min, max, numberCount, false);
    }

    /**
     * 生成不重复的随机整数数
     * @param min 最小值
     * @param max 最大值
     * @param numberCount 获取随机数的个数
     * @returns 
     */
    public static randomIntNonRepeat(min: number, max: number, numberCount?: number): number[] {
        return this.getRandomNonRepeat(min, max, numberCount, true);
    }

    /**
     * 计算源数值增加了若干百分比
     * @param origin 源数值
     * @param ratio 百分比（）
     * @returns 
     */
    public static percent(origin: number, ratio: number): number {
        return origin * (1 + ratio / 100);
    }

    /**
     * 是否为素数
     * @param num 
     */
    public static isPrime(num: number): boolean {
        for (let i: number = 2; (i * i) <= num; ++i) {
            if (!(num % i)) return false;
        }
        return true;
    }

    /**
     * 返回某个数以内的所有素数
     * @param num 
     */
    public static findPrime(num: number): number[] {
        let flag: number[] = [];
        let primeCount = 0;
        let primes: number[] = [];
        for (let i: number = 2; i <= num; ++i) {
            if (!flag[i]) {
                primeCount++;
                primes[primeCount] = i;
                for (let j: number = 2 * i; j <= num; j += i) {
                    flag[j] = 1;
                }
            }
        }
        return primes;
    }

    /**返回不重复随机数 */
    private static getRandomNonRepeat(min: number, max: number, numberCount?: number, int: boolean = true): number[] {
        if (!numberCount) {
            numberCount = max - min + 1;
        }
        if (numberCount === max - min + 1) {
            return this.nonRepeat2(min, max, int);
        }
        else if (int && numberCount < max - min + 1) {
            return this.nonRepeat1(min, max, numberCount, int);
        }
        else if (!int) {
            return this.nonRepeat1(min, max, numberCount, int);
        }
        return [];
    }

    /**获取不重复随机数的个数时,个数不等于最大值max时使用 */
    private static nonRepeat1(min: number, max: number, numberCount: number, int: boolean): number[] {
        let result: number[] = [];
        for (let i: number = 0; i < numberCount; ++i) {
            let repeat: boolean = false;
            let temp: number = int ? this.randomInt(min, max) : this.random(min, max);
            for (let k: number = 0; k < i; ++k) {
                if (temp === result[k]) {
                    repeat = true;
                    break;
                }
            }
            if (!repeat) {
                result.push(temp);
            }
            else {
                i--;
            }
        }

        return result;
    }
    /**获取随机数的个数时,个数等于最大值max时使用 */
    private static nonRepeat2(min: number, max: number, int: boolean): number[] {
        let result: number[] = [];
        for (let i: number = min; i <= max; ++i) {
            result.push(i);
        }
        for (let k: number = max - min; k >= 0; --k) {
            let index: number = int ? this.randomInt(0, max - min) : this.random(min, max);
            //交换两个元素的位置
            if (index !== k) {
                result[index] = result[index] + result[k];
                result[k] = result[index] - result[k];
                result[index] = result[index] - result[k];
            }
        }
        return result;
    }
}

const _tempHVec2 = v2(1, 0);
const _tempVec2 = v2(0, 0);
export namespace CCMathUtil {
    /**以v0为共同起点的v0, v1, v2三点构成的线段的方向类型 */
    export enum LineSegmentDirection {
        /**(v0, v2)线段在(v0, v1)线段的逆时针方向上 */
        anticlockwise = -1,
        /**(v0, v1, v2)3点共线 */
        collinear,
        /**(v0, v2)线段在(v0, v1)线段的顺时针方向上 */
        clockwise
    }
    /**三种角度类型 */
    export enum Angle {
        /**锐角 */
        acuteAngle = -1,
        /**直角 */
        rightAngle,
        /**钝角 */
        obtuseAngle
    }
    /**
     * 2D向量的一些计算函数库
     */
    export class Vector2D {
        /**
         * 计算坐标向量的tan值
         * @param a 
         * @param b 
         * @returns 如果x为0，即分母为0时，返回-1，否则返回正常计算的结果
         */
        public static getTanValue(a: Vec3, b?: Vec3) {
            let x: number, y: number;
            if (!b) {
                x = a.x;
                y = a.y;
            }
            else {
                x = a.x - b.x;
                y = a.y - b.y;
            }
            if (x !== 0) {
                return y / x;;
            }
            else {
                return -1;
            }
        }

        /**
         * 获取起始点和终点的角度（夹角为水平方向标准，即顺时针方向，与 rotationAngle 函数恰好相反）
         * @param start 
         * @param end 
         * @returns 
         */
        public static getAngle(start: Vec2, end: Vec2): number{
            let radian = Vec2.subtract(_tempVec2, end, start).signAngle(_tempHVec2);//获得带方向的夹角弧度值(参考方向顺时针为正值，逆时针为负值)
            let degree = -misc.radiansToDegrees(radian);
            return degree;
        }

        /**
         * 计算坐标向量的旋转角度，从X轴坐标大于0的象限逆时针旋转，最大值为360
         * @param a 
         * @param b
         * @returns 
         */
        public static rotationAngle(a: Vec3, b?: Vec3) {
            let x: number, y: number;
            if (!b) {
                x = a.x;
                y = a.y;
            }
            else {
                x = a.x - b.x;
                y = a.y - b.y;
            }
            const tanValue = this.getTanValue(a, b);
            if (tanValue !== -1) {
                const radian = Math.atan(Math.abs(tanValue));
                let angle = radian * (180 / Math.PI);
                if (x < 0 && y > 0) {
                    angle = 180 - angle;
                }
                else if (x < 0 && y < 0) {
                    angle += 180;
                }
                else if (x > 0 && y < 0) {
                    angle = 360 - angle;
                }
                return angle;
            }
            else {
                return y > 0 ? 90 : 270;
            }
            
        }

        /**
         * 把弧度计算成具体的角度，可以传入两个向量，计算两个向量的角度，也可以传入弧度计算角度
         * @param a 传入的弧度或者向量
         * @param b 传入的向量
         * @returns number
         */
        public static angle(a: number|Vec3, b?: Vec3): number {
            if (typeof a === "number") {
                return a as number * 180 / Math.PI;
            }
            else {
                return Vec3.angle(a as Vec3, b) * 180 / Math.PI;
            }
        }

        /**
         * 把角度计算成具体的弧度，可以传入具体的角度，计算成弧度，也可以传入两个向量，计算向量夹角的弧度
         * @param a 传入的角度或者向量
         * @param b 传入的向量
         * @returns 
         */
        public static radian(a: number|Vec3, b?: Vec3): number {
            if (typeof a === 'number') {
                return a * Math.PI / 180;
            }
            else {
                return Vec3.angle(a, b);
            }
        }

        /**
         * 2D坐标向量两点距离
         * @param v1 
         * @param v2 
         */
        public static distance(v1: Vec3, v2: Vec3): number {
            let X: number = (v1.x - v2.x) * (v1.x - v2.x);
            let Y: number = (v1.y - v2.y) * (v1.y - v2.y);
            let Z: number = (v1.z - v2.z) * (v1.z - v2.z);
            return Math.sqrt(X + Y + Z);
        }

        /**
         * 2D坐标向量相加
         * @param v1 
         * @param v2 
         * @returns 
         */
        public static add(v1: Vec3, v2: Vec3, out?: Vec3) {
            if (out instanceof Vec3) {
                out.set(v1.x + v2.x, v1.y + v2.y);
            }
            else {
                out = new Vec3(v1.x + v2.x, v1.y + v2.y);
            }
            return out;
        }

        /**
         * 2D坐标向量相减
         * @param v1 
         * @param v2 
         * @returns 
         */
        public static sum(v1: Vec3, v2: Vec3, out?: Vec3) {
            if (out instanceof Vec3) {
                out.set(v1.x - v2.x, v1.y - v2.y);
            }
            else {
                out = new Vec3(v1.x - v2.x, v1.y - v2.y);
            }
            return out;
        }

        /**
         * 判断向量相等
         * @param v1 
         * @param v2 
         * @returns 
         */
        public static equal(v1: Vec3, v2: Vec3) {
            return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
        }

        /**
         * 2D坐标向量点积运算
         * @param v1 
         * @param v2 
         * @returns 
         */
        public static dot(v1: Vec3, v2: Vec3) {
            return v1.x * v2.x + v1.y * v2.y;
        }

        /**
         * 2D坐标向量的模
         * @param v 
         * @returns 
         */
        public static vecLength(v: Vec3) {
            return Math.sqrt(this.dot(v, v));
        }

        /**
         * 2D坐标向量的叉积
         * @param v1 
         * @param v2 
         * @returns 
         */
        public static det(v1: Vec3, v2: Vec3) {
            return v1.x * v2.y - v1.y * v2.x;
        }

        /**
         * 2D向量v0到线段(v1,v2)的距离
         * @param v0 
         * @param v1 
         * @param v2 
         * @returns 
         */
        public static distPtoSegment(v0: Vec3, v1: Vec3, v2: Vec3) {
            let p1 = this.sum(v2, v1);
            let p2 = this.sum(v1, v2);
            let p3 = this.sum(v0, v1);
            let p4 = this.sum(v0, v2);

            if (this.equal(v1, v2)) {
                return this.vecLength(this.sum(v0, v1));
            }
            if (this.dot(p1, p3) < 0) {
                return this.vecLength(p3);
            }
            else if (this.dot(p2, p4) < 0) {
                return this.vecLength(p4);
            }
            else return Math.abs(this.det(p1, p3)) / this.vecLength(p1);
        }

        /**
         * 2D坐标向量计算线段(v0, v1)到线段(v0, v2)的方向
         * @param v0 
         * @param v1 
         * @param v2 
         * @returns 
         */
        public static dirPtoSegment(v0: Vec3, v1: Vec3, v2: Vec3) {
            let d = this.det(this.sum(v1, v0), this.sum(v2, v0));
            if (d === 0) {
                return CCMathUtil.LineSegmentDirection.collinear;
            }
            else if (d > 0) {
                return CCMathUtil.LineSegmentDirection.clockwise;
            }
            else return CCMathUtil.LineSegmentDirection.anticlockwise;
        }

        /**
         * 2D坐标向量计算线段(v0, v1)到线段(v0, v2)的夹角类型
         * @param v0 
         * @param v1 
         * @param v2 
         * @returns 
         */
        public static anglePtoSegment(v0: Vec3, v1: Vec3, v2: Vec3) {
            let d = this.dot(this.sum(v1, v0), this.sum(v2, v0));
            if (d === 0) {
                return CCMathUtil.Angle.rightAngle;
            }
            else if (d > 0) {
                return CCMathUtil.Angle.obtuseAngle;
            }
            else return CCMathUtil.Angle.acuteAngle;
        }

        /**
         * 判断点v0是否在(v1, v2)所构成的矩形内，其中v1是该矩形的左上角坐标点，v2是该矩形的右下角坐标点
         * @param v0 
         * @param v1 
         * @param v2 
         * @returns 
         */
        public static inRectangle(v0: Vec3, v1: Vec3, v2: Vec3) {
            return this.dot(this.sum(v1, v0), this.sum(v2, v0)) <= 0;
        }

        /**
         * 判断v0是否在(v1, v2)线段
         * @param v0 
         * @param v1 
         * @param v2 
         * @returns 
         */
        public static onSegment(v0: Vec3, v1: Vec3, v2: Vec3) {
            return this.det(this.sum(v1, v0), this.sum(v2, v0)) === 0 && this.dot(this.sum(v1, v0), this.sum(v2, v0)) <= 0;
        }

        /**
         * 判断线段(v1, v2)和线段(v3, v4)是否平行
         * @param v1 
         * @param v2 
         * @param v3 
         * @param v4 
         * @returns 
         */
        public static parallel(v1: Vec3, v2: Vec3, v3: Vec3, v4: Vec3) {
            return this.det(this.sum(v2, v1), this.sum(v4, v3)) === 0;
        }

        /**
         * 判断线段(v1, v2)与线段(v3, v4)是否相交
         * @param v1 
         * @param v2 
         * @param v3 
         * @param v4 
         * @returns 
         */
        public static segIntersect(v1: Vec3, v2: Vec3, v3: Vec3, v4: Vec3) {
            let d1 = this.dirPtoSegment(v3, v1, v4); //求 v3v1 在 v3v4 的哪个方向上
            let d2 = this.dirPtoSegment(v3, v2, v4); //求 v3v2 在 v3v4 的哪个方向上
            let d3 = this.dirPtoSegment(v1, v3, v2); //求 v1v3 在 v1v2 的哪个方向上
            let d4 = this.dirPtoSegment(v1, v4, v2); //求 v1v4 在 v1v2 的哪个方向上

            if (d1 * d2 < 0 && d3 * d4 < 0) {
                return true;
            }
            if (d1 === 0 && this.onSegment(v1, v3, v4)) {  //若 d1 为 0 且 v1 在 v3v4 线段上
                return true;
            }
            else if (d2 === 0 && this.onSegment(v2, v3, v4)) {  //若 d2 为 0 且 v2 在 v3v4 线段上
                return true;
            }
            else if (d3 === 0 && this.onSegment(v3, v1, v2)) {  //若 d3 为 0 且 v3 在 v1v2 线段上
                return true;
            }
            else if (d4 === 0 && this.onSegment(v4, v1, v2)) {  //若 d4 为 0 且 v4 在 v1v2 线段上
                return true;
            }
            return false;
        }

        /**
         * 判断点 v0 是否在点集 a 所形成的多边形内，只判断简单多边形的情况。
         * 简单多边形：设所有边都不相交的多边形为简单多边形，即所有的边形成一个闭合的多边形，边与边之间不会存在交叉情况。
         * 判断思路为从v0点引一条水平向右的射线，统计射线与多边形相交的情况，如果相交次数是奇数，则在多边形内，否则在多边形外。
         * @param v0 要判断的点v0
         * @param a 多边形的顶点集和
         * @returns 
         */
        public static vectorInPolygon(v0: Vec3, a: Vec3[]) {
            let cnt = 0; //累加相交点个数，当相交点个数为奇数时，点在多边形内，否则在多边形外
            let x: number;
            let v1: Vec3, v2: Vec3;
            for (let i = 0; i < a.length; ++i) {
                v1 = a[i]; v2 = a[i + 1]; //取多边形的一条边
                if (this.onSegment(v0, v1, v2)) { //如果 v0 点在多边形 v1v2 这条边上，说明 v0 已经在多边形上，返回true
                    return true;
                }
                //以下求解 y = v0.y 与 v1v2 的交点
                if (v1.y === v2.y) { //如果 v1v2 是水平线，直接跳过
                    continue;
                }
                //以下两种情况是交点在 v1v2 延长线上
                if (v0.y < v1.y && v0.y < v2.y) { //v0 在 v1v2 线段下方，直接跳过
                    continue;
                }
                if (v0.y >= v1.y && v0.y >= v2.y) { //v0 在 v1v2 线段上方，直接跳过
                    continue;
                }
                x = (v0.y - v1.x) * (v2.x - v1.x) / (v2.y - v1.y) + v1.x; //求交点坐标的 x 值
                if (x > v0.x) { //只统计射线水平向右的一边
                    cnt++;
                }
            }
            return cnt % 2 === 1;
        }
    }
}
