import { v2, Vec2 } from "cc";
import { Assert } from "../exceptions/Assert";
import { CCCircularQueue } from "./CCCircularQueue";

export class CCASCOORD {
    public x: number;
    public y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public isEquality(coord: CCASCOORD) {
            return this.x === coord.x && this.y === coord.y;
    }

    public setCoord(coord: CCASCOORD) {
        this.x += coord.x;
        this.y += coord.y;
    }
}

class StepData {
    public G: number;
    public H: number;
    public coord: CCASCOORD;
    public parentCoord: CCASCOORD;
    constructor(coord?: CCASCOORD) {
        coord && (this.coord = coord);
    }
}

/**
 * A* 寻路算法
 * 必须先调用SetMapSize设置地图大小, 然后再调用setGridSize设置网格大小, 调用setMapWidth设置地图宽, 调用setMapHeight设置地图高
 */
export class CCAStar {
    private _row: number;
    private _col: number;
    private _numSurround: number;
    private _gridSize: number;
    private _mapWidth: number;
    private _mapHeight: number;
    private _surround: CCASCOORD[];
    private _map: number[];
    private _gAdd: number[];
    private _openList: CCCircularQueue<StepData>;
    private _closeList: CCCircularQueue<StepData>;
    private _start: CCASCOORD;
    private _target: CCASCOORD;
    constructor() {
        this._row = 0;
        this._col = 0;
        this._numSurround = 8;
        this._gridSize = 0;
        this._mapWidth = 0;
        this._mapHeight = 0;
        this._surround = [];
        this._map = [];
        this._gAdd = [];
        this._openList = new CCCircularQueue(50);
        this._closeList = new CCCircularQueue(100);

        this._surround[0] = new CCASCOORD( 0,-1);
        this._surround[1] = new CCASCOORD( 0, 1);
        this._surround[2] = new CCASCOORD(-1, 0);
        this._surround[3] = new CCASCOORD( 1, 0);
        this._surround[4] = new CCASCOORD(-1,-1);
        this._surround[5] = new CCASCOORD( 1,-1);
        this._surround[6] = new CCASCOORD(-1, 1);
        this._surround[7] = new CCASCOORD( 1, 1);
        for(let i: number = 0; i < 4; ++i)
        {
            this._gAdd[i] = 10;
        }
        for(let i: number = 4; i < 8; ++i)
        {
            this._gAdd[i] = 14;
        }
    }

    /**
     * 创建A*地图，对A*地图的大小，行列数进行初始化
     * @param row 地图的最大行数
     * @param col 地图的最大列数
     * @param gridSize 一个地图网格的大小
     * @param width 地图的宽
     * @param height 地图的高
     */
    public static create(row: number, col: number, gridSize: number, width: number, height: number) {
        let aStar: CCAStar = new CCAStar();
        if (Assert.handle(Assert.Type.CreateObjectException, aStar, "A星寻路AStar")) {
            aStar.setMapSize(row, col);
            aStar.setGridSize(gridSize);
            aStar.setMapWidth(width);
            aStar.setMapHeight(height);
        }
        return aStar;
    }

    /**地图行, 对应地图坐标是Y轴 */
    public get row(): number { return this._row; }
    /**地图列, 对应地图坐标是X轴 */
    public get col(): number { return this._col; }

    /**
     * 地图网格大小
     * @param size 
     */
    public setGridSize(size: number): void {
        this._gridSize = size;
    }

    /**
     * 设置起始坐标点
     * @param coord 
     */
    public setStart(coord: CCASCOORD): void {
        this._start = coord;
    }

    /**
     * 设置终止坐标点
     * @param coord 
     */
    public setTarget(coord: CCASCOORD): void {
        this._target = coord;
    }

    /**
     * 设置地图宽
     * @param width 
     */
    public setMapWidth(width: number) {
        this._mapWidth = width;
    }

    /**
     * 设置地图高
     * @param height 
     */
    public setMapHeight(height: number) {
        this._mapHeight = height;
    }

    /**
     * 设置可不可以走对角线
     * @param enable 
     */
    public setDiagonalEnable(enable: boolean): void {
        this._numSurround = enable ? 8 : 4;
    }

    /**
     * 设置地图大小
     * @param row 行
     * @param col 列
     */
    public setMapSize(row: number, col: number): boolean {
        if (row <= 0 || col <= 0) {
            return false;
        }
        if (this._map) {
            delete this._map;
            this._map = [];
        }

        //采用bitmap方式存储地图, 设置障碍是插入值, 默认以一个字节8位来存储地图数据, 所以地图数组长度为地图最大格数N / 8 + 1,
        //需要转换为二进制计算, 8位能代表0~7数字, 当前位b所在的位如果为1, 则b - 1位这个数字存在, 反之为0,则不存在, 
        //设置障碍为在所在格子上插入值, 比如第5个格子, 则是需要找到第五个格子在数字map所在的下标, 由数组长度N / 8 + 1公式可得,
        //下标计算方式为N / 8, 当然要向下取整, 然后再通过5 % 8, 取余数就知道是在二进制第几个位, 然后再向左移动这么多位, 即 1 << (5%8), 
        //再用原来数组的数值与其移动后的二进制数按位或, 即原来数组的数值与00010000按位或, 就能在原来数值的二进制的第5位补上1, 即代表5这个数字存在,
        //即是第五个格子是障碍
        //如果是取消障碍, 步骤也是先找到第M个格子所在数组的下标位置, 然后让1左移M的到一个新的二进制数, 然后取反, 目的是让第M位是0, 
        //然后与原来数组中的值按位与运算, 就能把二进制第M位变0, 也就是第M个数不存在, 即是第M个格子不是障碍
        let size: number = row * col / 8 + 1;
        this.memset(this._map, 0, Math.floor(size));
        this._row = row;
        this._col = col;
        return true;
    }

    /**
     * 设置障碍
     * @param coord 障碍坐标点
     */
    public setObstacle(coord: CCASCOORD): void {
        if (!this.isOverstep(coord)) {
            let index: number = coord.y * this._col + coord.x;
            this._map[Math.floor(index/8)] |= 1 << (index%8);
        }
    }

    /**
     * 取消对应坐标点障碍
     * @param coord 障碍坐标点
     */
    public cancleObstacle(coord: CCASCOORD): void {
        if (!this.isOverstep(coord)) {
            let index: number = coord.y * this._col + coord.x;
            this._map[Math.floor(index/8)] &= ~(1 << index%8);
        }
    }

    /**
     * 是否是障碍
     * @param coord 判断的坐标点
     */
    public isObstacle(coord: CCASCOORD): number|boolean {
        if (!this.isOverstep(coord)) {
            let index: number = coord.y * this._col + coord.x;
            return this._map[Math.floor(index/8)] & (1 << (index%8));
        }
        return true;
    }

    /**
     * 清除所有障碍
     */
    public clearObstacles(): void {
        if (this._map.length > 0) {
            let size: number = this._row * this._col / 8 + 1;
            this.memset(this._map, 0, Math.floor(size));
        }
        this._openList.clear();
        this._closeList.clear();
    }

    public correctPosition(coord: CCASCOORD): Vec2 {
        let x: number = (this._gridSize + 2 * this._gridSize * coord.x - this._mapWidth) / 2;
        let y: number = (this._mapHeight - this._gridSize - 2 * this._gridSize * coord.y) / 2;
        return v2(x, y);
    }

    public convertToASCOORD(pos: Vec2): CCASCOORD {
        let x: number = (2 * pos.x + this._mapWidth - this._gridSize) / this._gridSize / 2;
        let y: number = (this._mapHeight - this._gridSize - 2 * pos.y) / this._gridSize / 2;
        return new CCASCOORD(Math.round(x), Math.round(y));
    }

    public findRoute(list: CCASCOORD[]) {
        this._closeList.clear();
        this._openList.clear();
        if (this._row <= 0 || this._col <= 0) {
            return false;
        }
        let sd: StepData = new StepData(this._start);
        sd.G = 0;
        sd.H = this.computeH(this._start);
        this._openList.push(sd);
        while(!this._openList.isEmpty()) {
            let newSD: StepData = this.findBestStep();
            this._closeList.push(newSD);
            if (this.findSurround(newSD)) {
                return this.getRoute(list);
            }
        }
        return false;
    }

    private getRoute(list: CCASCOORD[]) {
        let sd: StepData = this.findFromList(this._closeList, this._target);
        if (sd) {
            list.push(sd.coord);
            let next: CCASCOORD = sd.parentCoord;
            while(!next.isEquality(this._start)) {
                list.push(next);
                next = this.findFromList(this._closeList, next).parentCoord;
            }
            list.push(next);
            return true;
        }
        return false;
    }

    /**
     * 搜寻代价值最小的步骤
     */
    private findBestStep() {
        let tempSD: StepData = this._openList.back();
        let sd: StepData     = new StepData();
        if (tempSD) {
            sd.G         = tempSD.G;
            sd.H         = tempSD.H;
            sd.coord     = tempSD.coord;
            sd.parentCoord        = tempSD.parentCoord;
            let i: number         = 1;
            let flagIndex: number = 0;
            while(i !== this._openList.length) {
                let current: StepData = this._openList.back(i);
                if (sd.G + sd.H > current.G + current.H) {
                    sd.G         = current.G;
                    sd.H         = current.H;
                    sd.coord     = current.coord;
                    sd.parentCoord = current.parentCoord;
                    flagIndex      = i;
                }
                ++i;
            }
            this._openList.removeAt(flagIndex);
        }
        return sd;
    }

    /**
     * 寻找周围可移动的网格
     * @param sd 
     */
    private findSurround(sd: StepData) {
        const num = this._numSurround;
        for (let i: number = 0; i < num; ++i) {
            let coord: CCASCOORD = new CCASCOORD(sd.coord.x, sd.coord.y);
            coord.setCoord(this._surround[i]);
            if (this.judgeSurround(coord, sd.coord, sd.G + this._gAdd[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * 判定周围网格是否符合条件
     * @param coord 
     * @param parentCoord 
     * @param G 
     */
    private judgeSurround(coord: CCASCOORD, parentCoord: CCASCOORD, G: number): boolean {
        if (!this.isOverstep(coord) && !this.isObstacle(coord) && !this.isContain(this._closeList, coord)) {
            let sd: StepData = this.findFromList(this._openList, coord);
            if (sd) {
                sd.G = G;
                sd.parentCoord = parentCoord;
            }
            else {
                let newSD: StepData = new StepData(coord);
                newSD.G = G;
                newSD.H = this.computeH(coord);
                newSD.parentCoord = parentCoord;
                this._openList.push(newSD);
                if (newSD.coord.isEquality(this._target)) {
                    this._closeList.push(newSD);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 搜索列表里是否有该坐标点
     * @param list 
     * @param coord 
     */
    private findFromList(list: CCCircularQueue<StepData>, coord: CCASCOORD): StepData {
        const len = list.length;
        for (let i: number = 0; i < len; ++i) {
            let sd: StepData = list[i];
            if (coord.isEquality(sd.coord)) {
                return sd;
            }
        }
        return null;
    }

    private memset(list: any[], value: any, size: number): void {
        if (list) {
            for (let i: number = 0; i < size; ++i) {
                list[i] = value;
            }
        }
    }

    /**
     * 是否越界
     * @param coord 
     * @returns boolean
     */
    private isOverstep(coord: CCASCOORD): boolean {
        return !(coord.x >=0 && coord.x < this._col && coord.y >= 0 && coord.y < this._row);
    }
    /**
     * 关闭列表是否包含某一个坐标点
     * @param list 
     * @param coord 
     */
    private isContain(list: CCCircularQueue<StepData>, coord: CCASCOORD): boolean {
        const len = list.length;
        for (let i: number = 0; i < len; ++i) {
            if (coord.isEquality(list[i].coord)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 计算代价值H
     * @param coord 
     */
    private computeH(coord: CCASCOORD): number {
        return Math.abs(this._target.x - coord.x) * 10 + Math.abs(this._target.y - coord.y) * 10;
    }
}