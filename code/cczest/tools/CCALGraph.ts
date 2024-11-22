/****************************************************************
 *                   图存储结构的基本操作
 * 1.有向图
 * 2.无向图
 * 3.有向网
 * 4.无向网
 * ***************************************************************/

import { cc_zest_alGraph_edge_type, cc_zest_alGraph_vertex_type } from "../lib.ccspark";
import { Debug } from "../Debugger";
import { Assert } from "../exceptions/Assert";

type AdjList = cc_zest_alGraph_vertex_type[];

enum GraphType {
    /**有向图 */
    DG,
    /**无向图 */
    UDG
}

export class CCALGraph {
    private _adjList: AdjList;
    private _edge_num: number;
    private _vertex_num: number;
    private _graph_t: GraphType;

    constructor(type: GraphType) {
        this._edge_num = 0;
        this._vertex_num = 0;
        this._graph_t = type;
        this._adjList = [];
    }

    /**图的类型，无向图和有向图 */
    public static get GraphType(): { DG: number; UDG: number } { return GraphType; }
    /**边的数量 */
    public get edgeNum(): number { return this._edge_num; }
    /**顶点的数量 */
    public get vertexNum(): number { return this._vertex_num; }


    /**
     * 创建图数据结构操作类
     * @param type 图的类型
     * @returns 
     */
    public static create(type: GraphType = GraphType.UDG): CCALGraph {
        let alGraph: CCALGraph = new CCALGraph(type);
        Assert.handle(Assert.Type.CreateObjectException, alGraph, "ALGraph");
        return alGraph;
    }

    /**通过顶点数据，找到顶点在顶点表中的序号,序号从0开始，如果没有这个顶点，返回-1 */
    public locateVertex(vt: cc_zest_alGraph_vertex_type): number {
        let ver_num: number = this._adjList.indexOf(vt);
        if (ver_num > -1) {
            return ver_num;
        }
        return -1;
    }

    /**通过序号，找到顶点数据 */
    public getVertex(num: number): cc_zest_alGraph_vertex_type {
        let vt: cc_zest_alGraph_vertex_type = this._adjList[num];
        if (vt) {
            return vt;
        }
        return null;
    }

    /**通过序号，设置顶点 */
    public setVertex(n: number, vt: cc_zest_alGraph_vertex_type): boolean {
        if (!vt) {
            return false;
        }
        vt.firstArc = null;
        this._adjList[n] = vt;
        this._vertex_num++;
        return true;
    }

    /**插入一个顶点 */
    public insertVertex(vt: cc_zest_alGraph_vertex_type): boolean {
        if (this._adjList.indexOf(vt) === -1) {
            vt.firstArc = null;
            this._adjList[this._vertex_num] = vt;
            this._vertex_num++;
            return true;
        }
        return false;
    }

    /**插入一条边 */
    public insertEdge(staVex: number, adjVex: number, weight: number = 1): boolean {
        if (Assert.handle(Assert.Type.InsertEdgeException, staVex !== adjVex, `{${staVex}, ${adjVex}}`)) {
            if (this._graph_t === GraphType.DG) {
                //有向图的边指向其中一个顶点
                return this.addEdge(staVex, adjVex, weight);
            }
            else if (this._graph_t === GraphType.UDG) {
                //无向图的边指向这条边的两个顶点
                return this.addEdge(staVex, adjVex, weight) && this.addEdge(adjVex, staVex, weight);
            }
        }
        return false;
    }

    /**删除一个顶点 */
    public deleteVertex(vt: cc_zest_alGraph_vertex_type): boolean {
        if (!Assert.handle(Assert.Type.DeleteVertexException, vt, typeof vt)) {
            return false;
        }
        let adjVex: number = this._adjList.indexOf(vt);
        if (adjVex === -1) {
            Debug.error('邻接表中不存在这个顶点');
            return false;
        }
        let p: cc_zest_alGraph_edge_type = vt.firstArc;
        if (this._graph_t === GraphType.UDG) {
            while (p) {
                let adjVexP: cc_zest_alGraph_vertex_type = this._adjList[p.adjvex];
                let adjP: cc_zest_alGraph_edge_type = adjVexP.firstArc;
                if (adjP) {
                    while (adjP.nextArc && adjP.nextArc.adjvex !== adjVex) {
                        adjP = adjP.nextArc;
                    }
                    if (adjP.nextArc) {
                        let q: cc_zest_alGraph_edge_type = adjP.nextArc;
                        adjP.nextArc = q.nextArc;
                        q = null;
                        this._edge_num--;
                    }
                    else {
                        Debug.error('无向图存储错误，%d号顶点边结点链表里不存在指向%d号顶点的边！', p.adjvex, adjVex);
                        return false;
                    }
                }
                else {
                    Debug.error('无向图存储错误，%d号顶点边结点链表里没有存储任何边结点！', p.adjvex);
                    return false;
                }
                p = p.nextArc;
                this._edge_num--;
            }
            delete this._adjList[adjVex];
            this._vertex_num--;
            vt = null;
        }
        else if (this._graph_t === GraphType.DG) {
            while (p) {
                p = p.nextArc;
                this._edge_num--;
            }
            delete this._adjList[adjVex];
            this._vertex_num--;
            vt = null;
        }
        return true;
    }

    /**删除一条边 */
    public deleteEdge(staVex: number, adjVex: number): boolean {
        if (Assert.handle(Assert.Type.DeleteEdgeException, staVex !== adjVex, `{${staVex}, ${adjVex}}`)) {
            if (this._graph_t === GraphType.UDG) {
                return this.moveEdge(staVex, adjVex) && this.moveEdge(adjVex, staVex);
            }
            else if (this._graph_t === GraphType.DG) {
                return this.moveEdge(staVex, adjVex);
            }
        }
        return false;
    }

    /**
     * 深度优先遍历图
     * @param v 起始顶点
     * @param callback 搜索条件，return false则遍历所有顶点，否则在条件成立时停止遍历
     */
    public DFS(v: number, callback: (v: number) => boolean): { condition: boolean, vexList: number[] } {
        let vexList: number[] = [];
        if (v >= this._vertex_num) {
            //错误，顶点编号越界
            return { condition: false, vexList: vexList };
        }
        let stack: number[] = [];
        stack.push(v);
        vexList.push(v);
        if (callback(v)) {
            return { condition: callback(v), vexList: vexList };
        }
        let visited: number[] = [];
        for (let i: number = 0; i < this._vertex_num; ++i) {
            visited[i] = 0;
        }
        visited[v] = 1;
        let p: cc_zest_alGraph_edge_type = this._adjList[v].firstArc;
        while (p) {
            if (visited[p.adjvex] === 0) {
                visited[p.adjvex] = 1;
                stack.push(p.adjvex);
                vexList.push(p.adjvex);
                if (callback(p.adjvex)) {
                    return { condition: callback(p.adjvex), vexList: vexList };
                }
                let temp: number = stack.pop();
                if (v === temp) {
                    break;
                }
                p = this._adjList[temp].firstArc;
                if (!p) {
                    p = p.nextArc;
                }
            }
            else {
                p = p.nextArc;
            }
        }
        return { condition: false, vexList: vexList };
    }

    /**
     * 搜索顶点u到顶点v是否有路劲
     * @param u 
     * @param v 
     */
    public existPath(u: number, v: number): boolean {
        let re: { condition: boolean, vexList: number[] } = this.DFS(u, (_v: number) => {
            return _v === v;
        });
        return re.condition;
    }

    /**
     * 找到一条顶点u到顶点v的路劲
     * @param u 
     * @param v 
     */
    public findAPath(u: number, v: number): number[] {
        let re: { condition: boolean, vexList: number[] } = this.DFS(u, (_v: number) => {
            return _v === v;
        });
        return re.vexList;
    }

    public findAllPath(u: number, v: number) {
        
    }

    private addEdge(staVex: number, adjVex: number, weight: number = 1): boolean {
        let edge: cc_zest_alGraph_edge_type;
        let n: number = -1;
        if (!this._adjList[staVex]) {
            n = staVex;
        }
        if (this._adjList[adjVex]) {
            edge = { adjvex: adjVex, weight: weight, nextArc: null };
        }
        else {
            n = adjVex;
        }
        if (n > -1) {
            Debug.error('邻接表中不存在编号为%d这个顶点', n);
            return false;
        }
        let vex: cc_zest_alGraph_vertex_type = this._adjList[staVex];
        let p: cc_zest_alGraph_edge_type = vex.firstArc;
        if (!p) {
            this._edge_num++;
            vex.firstArc = edge;
            return true;
        }
        else {
            let head: cc_zest_alGraph_edge_type = null;//便于链表操作
            while (p && p.adjvex > adjVex) {
                head = p;
                p = p.nextArc;
            }
            if (p) {
                if (head) {
                    edge.nextArc = p;
                    head.nextArc = edge;
                }
                else {
                    vex.firstArc = edge;
                    edge.nextArc = p;
                }
            }
            else {
                head.nextArc = edge;
            }
            this._edge_num++;
            return true;
        }
    }

    private moveEdge(staVex: number, adjVex: number) {
        let n: number = -1;
        if (!this._adjList[staVex]) {
            n = staVex;
        }
        if (!this._adjList[adjVex]) {
            n = adjVex;
        }
        if (n > -1) {
            Debug.error('邻接表中不存在编号为%d这个顶点', n);
            return false;
        }
        let vex: cc_zest_alGraph_vertex_type = this._adjList[staVex];
        let p: cc_zest_alGraph_edge_type = vex.firstArc;
        if (!p) {
            Debug.error('这两个顶点之间不存在边，无法删除！');
            return false;
        }
        if (p.adjvex === adjVex) {
            this._edge_num--;
            vex.firstArc = p.nextArc;
            p = null;
        }
        else {
            while (p.nextArc && p.nextArc.adjvex !== adjVex) {
                p = p.nextArc;
            }
            if (!p.nextArc) {
                Debug.error('这两个顶点之间不存在边，无法删除！');
                return false;
            }
            else {
                this._edge_num--;
                let q: cc_zest_alGraph_edge_type = p.nextArc;
                p.nextArc = q.nextArc;
            }
        }
        return true;
    }
}