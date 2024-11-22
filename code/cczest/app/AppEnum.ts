export enum GamePlatform { 
    /**预览模式 */
    PREVIEW,
    /**网页H5平台 */
    BROWSER,
    /**微信小游戏平台 */
    WECHAT,
    /**字节小游戏平台 */
    BYTE,
    /**安卓原生平台 */
    ANDROID,
    /**苹果原生平台 */
    IOS,
    /**window平台 */
    WIN32
}

/**游戏场景类型 */
export enum GameSceneType {
    /**不是任何类型的场景，非法的选项，不可选择 */
    NONE = -1,
    /**普通场景 */
    Normal,
    /**过渡阶段的场景（一般类似用于加载资源的场景） */
    Interim
}

export enum SceneEvent {
    CLICK_MASK = "CLICK_MASK",
    RUN_SCENE = "RUN_SCENE",
    DESTROY_SCENE = "DESTROY_SCENE"
}

export enum GameWorldEvent {
    INIT_GAME = "INIT_GAME"
}