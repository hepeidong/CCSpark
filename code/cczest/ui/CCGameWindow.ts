import { Component } from "cc";
import { IGameLayout } from "../lib.ccspark";
import { Assert } from "../exceptions/Assert";
import { CCGameLayout } from "./CCGameLayout";
import { WindowBase } from "./WindowBase";
import { WindowManager } from "./WindowManager";
import { app } from "../app";


export class CCGameWindow<T extends IGameLayout> extends WindowBase<T> {
    constructor(accessId: string) {
        super(accessId);
    }

    protected showWait() {
        app.game.sceneManager.showWaitView();
    }

    protected closeWait() {
        app.game.sceneManager.hideWaitView();
    }

    protected _loadView() {
        this.initViewComponent();
        this.addListener(this.viewComponent);
    }

    protected _openView() {
        this.view.popup();
    }

    protected _closeView(switchingScene: boolean) {
        if (switchingScene) {
            this.removeView();
            WindowManager.instance.exitView(this);
        }
        else {
            this.view.close();
        }
    }

    private initViewComponent() {
        let flag = false;
        const components = this.node.getComponents(Component);
        for (const component of components) {
            if (component instanceof CCGameLayout) {
                component["_bundbleName"] = this.bundbleName;
                this.setViewComponent(component);
                flag = true;
                return;
            }
        }
        Assert.handle(Assert.Type.GetComponentException, flag, "GameLayout");
    }

    private addListener(gameUI: IGameLayout) {
        gameUI.setStartListener(() => {
            this.popupView();
            if (this.winModel === "TOAST") {
                WindowManager.instance.delView(this.getViewType(), false);
            }
        }, this);
        gameUI.setCompleteListener(() => {
            WindowManager.instance.shiftMask();
            this.removeView();
            WindowManager.instance.exitView(this);
        }, this);
        if (this.winModel !== "TOAST") {
            gameUI.setBackBtnListener(() => WindowManager.instance.delView(this.getViewType(), false));
        }
        if (this.winModel === "DIALOG" || this.winModel === "ACTIVITY") {
            gameUI.setPopupSpring();
        }
    }
}