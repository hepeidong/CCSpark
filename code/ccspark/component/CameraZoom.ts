//相机缩放

import { _decorator, Component, Camera, view, Enum, math } from 'cc';
const { ccclass, property, executionOrder, executeInEditMode, menu } = _decorator;

enum FovType {
    default,
    custom
}

@ccclass('CameraZoom')
@executionOrder(-98)
@executeInEditMode
@menu("游戏通用组件/摄像机/CameraZoom(相机变焦)")
export class CameraZoom extends Component {

    @property({
        tooltip: "设置相机旋转的角度，包括相机父节点旋转的角度"
    })
    private rotation: math.Vec3 = math.v3(0, 0, 0);

    @property
    private _fovType: FovType = FovType.custom;

    @property({
        type: Enum(FovType),
        tooltip: "default：默认的fov会自动计算摄像机照射到设计分辨率全屏的fov；custom：自定义的fov会根据这个fov值计算摄像机zoomRatio这个值",
        displayName: "fov类型"
    })
    private get fovType() { return this._fovType; }
    private set fovType(val: FovType) {
        this._fovType = val;
        this.initFov();
    }

    private _orthoHeight: number = 0;
    private _zoomRatio: number = 1;
    private _fov: number = 0;


    public get zoomRatio(): number {
        return this._zoomRatio;
    }
    public set zoomRatio(zoomRatio: number) {
        this._zoomRatio = zoomRatio;
        if (this.camera.projection == Camera.ProjectionType.ORTHO) {
            this.camera.orthoHeight = this._orthoHeight / this._zoomRatio;
        } else if (this.camera.projection == Camera.ProjectionType.PERSPECTIVE) {
            if (this.fovType === FovType.default) {
                this.calculatDefaultFov();
            }
            else if (this.fovType === FovType.custom) {
                this.calulatCustomFov();
            }
        }
    }

    camera: Camera = null;

    onLoad() {
        this.camera = this.node.getComponent(Camera);
        this._orthoHeight = this.camera.orthoHeight;
        this.initFov(); 
    }

    private initFov() {
        if (this.fovType === FovType.default) {
            this.calculatDefaultFov();
        }
        else if (this.fovType === FovType.custom) {
            this._fov = this.camera.fov;
        }
    }

    private calculatDefaultFov() {
        this._fov = this.getFov();
        let rad = this.radian(this._fov / 2);
        rad = Math.atan(Math.tan(rad) / this.zoomRatio) * 2;
        this.camera.fov = this.angle(rad);
    }

    private calulatCustomFov() {
        let z = this.getZ();
        const red = this.radian(this._fov / 2);
        let h = Math.tan(red) * z;
        let currentFov = this.angle(2 * Math.atan(h * this.zoomRatio / z));
        this.camera.fov = this._fov * 2 - currentFov;
    }

    private radian(angle: number) {
        return angle * (Math.PI / 180);
    }

    private angle(radian: number) {
        return radian * (180 / Math.PI);
    }

    private getZ() {
        let z = this.camera.node.position.z;
        const red = this.radian(this._fov / 2);
        if (this.camera.fovAxis === Camera.FOVAxis.VERTICAL) {
            if (this.rotation.x > 0) {
                z = Math.cos(red) * z;
            }
        }
        else if (this.camera.fovAxis === Camera.FOVAxis.HORIZONTAL) {
            if (this.rotation.y > 0) {
                z = Math.cos(red) * z;
            }
        }
        return z;
    }

    private getFov() {
        let z = this.camera.node.position.z;
        let a: number;
        if (this.camera.fovAxis === Camera.FOVAxis.VERTICAL) {
            a = view.getDesignResolutionSize().height / 2;
        }
        else if (this.camera.fovAxis === Camera.FOVAxis.HORIZONTAL) {
            a = view.getDesignResolutionSize().width / 2;
        }
        const rad = Math.atan(a / z);
        const dre = this.angle(rad);
        return dre * 2;
    }
}
