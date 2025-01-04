import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { Assert } from "../exceptions/Assert";
import { AudioClip, resources } from "cc";
import { AudioEngine } from "./AudioEngine";
import { Res } from "../res/Res";
import { tools } from "../tools";
import { cc_zest_audio_type, IAudio, IAudioBGM, IAudioEffect, ILoader, ITweenAudio } from "zest";


/**
 * author: 何沛东
 * date: 2020/10/20
 * description: TweenAudio 提供一个灵活的方式来播放音频，支持链式结构播放音频，可以顺序播放多个音频，延迟播放，抛出异常等等
 */
export class TweenAudio implements ITweenAudio {
    private _status: string = 'pending';
    private _err: Error;
    private _audioIndex: number;
    private _audioCount: number;
    private _canPlay: boolean;
    private _model: TweenAudio.Model;
    private _bundle: string;
    private _audioList: string[];
    private _audioPool: Map<string, cc_zest_audio_type>;
    private _rejected: Function;
    private static _audioEngine: AudioEngine = new AudioEngine();
    
 
    constructor(bundle: string) {
        this._bundle = bundle;
        this._status = 'pending';
        this._audioIndex = 0;
        this._audioCount = 0;
        this._canPlay = false;
        this._model   = TweenAudio.Model.NONE;
        this._audioList = [];
        this._audioPool = new Map();
    }

    public static create(bundle: string = resources.name): ITweenAudio {
        return new TweenAudio(bundle);
    }

    public static get audioEngine() { return this._audioEngine; }

    static stopAll() {
        this.audioEngine.stopAll();
    }

    public set volume(v: number) {
        let audioPro: cc_zest_audio_type = this._audioPool.get(this._audioList[this._audioIndex]);
        if (audioPro && audioPro.audioID > -1) {
            TweenAudio.audioEngine.setVolume(audioPro.audioID, v);
        }
        else if (audioPro) {
            this.notLoadAudio(audioPro.audio.url);
        }
    }

    public get volume(): number {
        if (this._audioCount > 1) {
            this._status = 'rejected';
            this._err = new Error('不能同时获取多个音频的音量!');
        }
        else {
            let audioPro: cc_zest_audio_type = this._audioPool.get(this._audioList[this._audioIndex]);
            if (audioPro && audioPro.audioID > -1) {
                return TweenAudio.audioEngine.getVolume(audioPro.audioID);
            }
            else if (audioPro) {
                this.notLoadAudio(audioPro.audio.url);
            }
        }
        return -1;
    }

    public set loop(l: boolean) {
        let audioPro: cc_zest_audio_type = this._audioPool.get(this._audioList[this._audioIndex]);
        if (audioPro && audioPro.audioID > -1) {
            TweenAudio.audioEngine.setLoop(audioPro.audioID, l);
        }
        else if (audioPro) {
            this.notLoadAudio(audioPro.audio.url);
        }
    }

    public get loop(): boolean {
        if (this._audioCount > 1) {
            this._status = 'rejected';
            this._err = new Error('不能同时获取多个音频的循环状态!');
        }
        else {
            let audioPro: cc_zest_audio_type = this._audioPool.get(this._audioList[this._audioIndex]);
            if (audioPro && audioPro.audioID > -1) {
                return TweenAudio.audioEngine.isLoop(audioPro.audioID);
            }
            else if (audioPro) {
                this.notLoadAudio(audioPro.audio.url);
            }
        }
        return false;
    }

    /**
     * 设置音频播放模式
     * @param model 是否顺序播放
     */
    public audio(model: TweenAudio.Model): TweenAudio {
        if (this._model !== TweenAudio.Model.NONE) {
            this.reset();
        }
        this._model = model;
        return this;
    }

    /**
     * 把要播放的背景音乐压入队列中，等待播放
     * @param props 音频属性
     */
    public bgm(props: IAudioBGM): TweenAudio {
        if (!props.url) {
            this._status = 'rejected';
            this._err = new Error('必须指定音频资源的路径！');
        }
        else {
            this._audioList.push(props.url);
            if (this._audioPool.has(props.url)) {
                this._audioPool.get(props.url).audio = props;
            }
            else {
                this._audioPool.set(props.url, this.bgmProps(props));
            }
            this.audioLoaded(props);
        }
        return this;
    }
    /**
     * 把要播放的音效压入队列中，等待播放
     * @param props 音频属性
     */
    public effect(props: IAudio): TweenAudio {
        if (!props.url) {
            this._status = 'rejected';
            this._err = new Error('必须指定音频资源的路径！');
        }
        else {
            this._audioList.push(props.url);
            if (this._audioPool.has(props.url)) {
                this._audioPool.get(props.url).audio = props;
            }
            else {
                this._audioPool.set(props.url, this.effectProps(props));
            }
            this.audioLoaded(props);
        }
        return this;
    }

    public onPlay(resolve: (currentTime: number) => void) {
        return this.when("play", resolve);
    }

    public onStop(resolve: (duration: number) => void) {
        return this.when("stop", resolve);
    }
    
    /**
     * 播放音频时要执行的回调
     * @param callType 回调类型
     * @param resolve 执行的回调
     */
    private when<T extends 'play'|'stop'>(callType: T, resolve: Function): TweenAudio {
        let len: number = this._audioList.length;
        if (len === 0) {
            this._status = 'rejected';
            this._err = new Error('必须先指定播放哪个音频！');
        }
        else {
            let key: string = this._audioList[len - 1];
            this._audioPool.get(key).callbacks.push({type: callType, call: resolve});
        }
        return this;
    }

    /**开始播放音频 */
    public play(): TweenAudio {
        this._canPlay = true;
        if (this._audioList.length === this._audioCount) {
            this.tryPlay();
        }
        return this;
    }

    public pause(): TweenAudio {
        const len = this._audioList.length;
        for (let i: number = 0; i < len; ++i) {
            let audioPro: cc_zest_audio_type = this._audioPool.get(this._audioList[i]);
            if (audioPro && audioPro.audioID > -1) {
                TweenAudio.audioEngine.pause(audioPro.audioID);
            }
            else if (audioPro) {
                this.notLoadAudio(audioPro.audio.url);
            }
        }
        return this;
    }

    public resume(): TweenAudio {
        const len = this._audioList.length;
        for (let i: number = 0; i < len; ++i) {
            let audioPro: cc_zest_audio_type = this._audioPool.get(this._audioList[i]);
            if (audioPro && audioPro.audioID > -1) {
                TweenAudio.audioEngine.resume(audioPro.audioID);
            }
            else if (audioPro) {
                this.notLoadAudio(audioPro.audio.url);
            }
        }
        return this;
    }

    public stop(): TweenAudio {
        this._canPlay = false;
        this.tryPlay();
        return this;
    }

    /**释放音频资源 */
    public clear() {
        if (Res.hasLoader(this._bundle)) {
            const loader = Res.getLoader(this._bundle);
            this._audioPool.forEach((audio) => {
                loader.delete(audio.clip);
            });
            this._audioPool.clear();
            this.reset();
        }
    }

    /**
     * 抛出异常
     * @param reject 
     */
    public catch(reject: (e: Error) => void): ITweenAudio {
        if (this._status === 'rejected') {
            SAFE_CALLBACK(reject, this._err);
        }
        else {
            this._rejected = reject;
        }
        return this;
    }

    private callRejected() {
        if (this._status === "rejected") {
            SAFE_CALLBACK(this._rejected, this._err);
        }
    }

    private stopAudio() {
        if (this._model === TweenAudio.Model.LOOP || this._model === TweenAudio.Model.ORDER) {
            if (this._audioIndex < this._audioList.length) {
                const url = this._audioList[this._audioIndex];
                const audioPro = this._audioPool.get(url);
                if (audioPro) {
                    if (audioPro.audioID > -1) {
                        if (!audioPro.played) {
                            TweenAudio.audioEngine.stop(audioPro.audioID);
                        }
                    }
                    else {
                        this.runPlayCallbacks(audioPro);
                        this.notLoadAudio(audioPro.audio.url);
                    }
                    if (this._model === TweenAudio.Model.LOOP) {
                        this.onFinishCallbackInLoop(audioPro);
                    }
                    else if (this._model === TweenAudio.Model.ORDER) {
                        this.onFinishCallbackInOrder(audioPro);
                    }
                }
            }
        }
        else if (this._model === TweenAudio.Model.PARALLEL) {
            const len = this._audioList.length;
            for (let i: number = 0; i < len; ++i) {
                const audioPro: cc_zest_audio_type = this._audioPool.get(this._audioList[i]);
                if (audioPro) {
                    if (audioPro.audioID > -1) {
                        if (!audioPro.played) {
                            TweenAudio.audioEngine.stop(audioPro.audioID);
                        }
                    }
                    else {
                        this.runPlayCallbacks(audioPro);
                        this.notLoadAudio(audioPro.audio.url);
                    }
                    this.onFinishCallback(audioPro);
                }
            }
        }
    }

    private tryPlay(): void {
        if (this._canPlay) {
            try {
                if (this._status === 'pending') {
                    if (this._model === TweenAudio.Model.ORDER) {
                        this.playInterval(this.playAudioInOrder.bind(this));
                    }
                    else if (this._model === TweenAudio.Model.LOOP) {
                        this.playInterval(this.playAudioInLoop.bind(this));
                    }
                    else if (this._model === TweenAudio.Model.PARALLEL) {
                        this.playAudioAll();
                    }
                    else {
                        this._status = 'rejected';
                        this._err = new Error(`播放模式是非法的，当前播放模式为 ${this._model}， 请调用 audio 函数设置播放模式！`);
                        this.callRejected();
                    }
                }
            } catch (error) {
                this._status = 'rejected';
                this._err = error;
                this.callRejected();
            }
        }
        else if (!this._canPlay) {
            try {
                if (this._status === 'pending') {
                    this.stopAudio();
                }
            } catch (error) {
                this._status = 'rejected';
                this._err = error;
                this.callRejected();
            }
        }
    }

    private async audioLoaded(props: IAudio) {
        Debug.log('[AudioManager] audioLoaded TweenAudio props', props);
        let clip: AudioClip|void;
        const audioData = this._audioPool.get(props.url);
        if (audioData.clip) {
            clip = audioData.clip;
            this._audioCount++;
        }
        else {
            clip = await this.awaitLoad(props.url).catch((e) => {
                this._status = e;
                this.callRejected();
            });
            if (clip) {
                this._audioCount++;
                this._audioPool.has(props.url) && (this._audioPool.get(props.url).clip = clip);
            }
        }
        if (this._status === 'pending') {
            this.tryPlay();
        }
    }

    private async awaitLoad(url: string) {
        const loader = await this.createLoader().catch(err => {
            Assert.handle(Assert.Type.LoadAssetBundleException, err, this._bundle);
        });
        if (loader) {
            return new Promise<AudioClip>((resolve, reject) => {
                loader.load(url, (err: Error, clip: AudioClip) => {
                    if (err) {
                        Debug.error('音频加载失败');
                        this._err = err;
                        reject('rejected');
                    }
                    else {
                        resolve(clip);
                    }
                });
            });
        }
        return undefined;
    }

    private createLoader() {
        return new Promise<ILoader>((resolve, reject) => {
            if (this._bundle === resources.name) {
                resolve(Res.loader);
            }
            else {
                Res.createLoader(this._bundle).then(loader => {
                    resolve(loader);
                }).catch(err => {
                    reject(err);
                });
            }
        });
    }

    private reset(): void {
        this._status     = 'pending';
        this._audioIndex = 0;
        this._audioCount = 0;
        this._canPlay = false;
        this._audioList.splice(0, this._audioList.length);
    }

    private playAudio(index: number, finishCallback: (audioPro: cc_zest_audio_type) => void) {
        const key: string = this._audioList[index];
        const audioPro: cc_zest_audio_type = this._audioPool.get(key);
        let audioID: number;
        if (this._model === TweenAudio.Model.LOOP || this._model === TweenAudio.Model.ORDER) {
            audioPro.audio.loop = false;
        }
        if (audioPro.bgm) {
            if ((audioPro.audio as IAudioBGM).superpose) {
                audioID = TweenAudio.audioEngine.playBGM(audioPro.clip, audioPro.audio.loop, audioPro.audio.volume);
            }
            else {
                audioID = TweenAudio.audioEngine.playMusic(audioPro.clip, audioPro.audio.loop, audioPro.audio.volume);
            }
        }
        else {
            audioID = TweenAudio.audioEngine.playEffect(audioPro.clip, (audioPro.audio as IAudioEffect).oneShot, audioPro.audio.loop, audioPro.audio.volume);
        }
        audioPro.audioID = audioID;
        this._audioPool.set(key, audioPro);
        //设置音频结束后的回调
        TweenAudio.audioEngine.setFinishCallback(audioID, () => finishCallback(audioPro));
        this.runPlayCallbacks(audioPro);
    }

    /**一次性播放队列所有音频 */
    private playAudioAll() {
        const len = this._audioList.length;
        if (len === this._audioCount) {
            for (let i: number = 0; i < len; ++i) {
                this.playAudio(i, this.onFinishCallback.bind(this));
            }
        }
    }

    private runPlayCallbacks(audioPro: cc_zest_audio_type) {
        const audioID = audioPro.audioID;
        const callbacks = audioPro.callbacks;
        for (const callback of callbacks) {
            if (callback.type === 'play') {
                SAFE_CALLBACK(callback.call, TweenAudio.audioEngine.getCurrentTime(audioID));
            }
        }
    }

    private runStopCallbacks(audioPro: cc_zest_audio_type) {
        const audioID = audioPro.audioID;
        const callbacks = audioPro.callbacks;
        for (const callback of callbacks) {
            if (callback.type === 'stop') {
               SAFE_CALLBACK(callback.call, TweenAudio.audioEngine.getDuration(audioID));
            }
        }
    }

    //非顺序播放模式下,每个音频结束的回调
    private onFinishCallback(audioPro: cc_zest_audio_type) {
        audioPro.played = true;
        this.runStopCallbacks(audioPro);
        this._audioIndex++;
        if (this._audioIndex === this._audioList.length) {
            this.reset();
        }
    }

    //顺序播放模式下每个音频结束的回调
    private onFinishCallbackInOrder(audioPro: cc_zest_audio_type) {
        audioPro.played = true;
        this.runStopCallbacks(audioPro);
        this._audioIndex++;
        if (this._audioIndex < this._audioList.length) {
            if (this._canPlay) {
                this.playInterval(this.playAudioInOrder.bind(this));
            }
        }
        else {
            this.reset();
        }
    }

    //循环模式下播放每一个音频的回调
    private onFinishCallbackInLoop(audioPro: cc_zest_audio_type) {
        audioPro.played = true;
        this.runStopCallbacks(audioPro);
        this._audioIndex++;
        if (this._audioIndex === this._audioList.length) {
            this._status     = 'pending';
            this._audioIndex = 0;
        }
        if (this._canPlay) {
            this.playInterval(this.playAudioInLoop.bind(this), audioPro);
        }
    }

    /**按顺序播放音频 */
    private playAudioInOrder() {
        this.playAudio(this._audioIndex, this.onFinishCallbackInOrder.bind(this));
    }

    /**循环播放音频 */
    private playAudioInLoop(lastAudioPro: cc_zest_audio_type) {
        if (lastAudioPro) {
            lastAudioPro.played = false;
        }
        this.playAudio(this._audioIndex, this.onFinishCallbackInLoop.bind(this));
    }

    private playInterval(playAudioCallback: Function, lastAudioPro?: cc_zest_audio_type) {
        let key: string = this._audioList[this._audioIndex];
        let audioPro: cc_zest_audio_type = this._audioPool.get(key);
        if (audioPro.clip) {
            tools.Timer.setInterval(() => {
                playAudioCallback(lastAudioPro);
            }, audioPro.audio.delay);
        }
    }

    private bgmProps(props: IAudioBGM): cc_zest_audio_type {
        let audioPro: cc_zest_audio_type = {
            audio: {
                url: props.url,
                loop: (props.loop === undefined || props.loop === null) ? false : props.loop,
                volume: (props.volume === null || props.volume === undefined) ? 1 : props.volume,
                delay: props.delay ? props.delay : 0,
                superpose: (props.superpose === undefined || props.superpose === null) ? true : props.superpose
            }, 
            callbacks: [],
            clip: null,
            played: false,
            audioID: -1,
            bgm: true
        };
        return audioPro;
    }

    private effectProps(props: IAudioEffect): cc_zest_audio_type {
        let audioPro: cc_zest_audio_type = {
            audio: {
                url: props.url,
                loop: (props.loop === undefined || props.loop === null) ? false : props.loop,
                volume: (props.volume === null || props.volume === undefined) ? 1 : props.volume,
                delay: props.delay ? props.delay : 0,
                oneShot: (props.oneShot === undefined || props.oneShot === null) ? true : props.oneShot
            }, 
            callbacks: [],
            clip: null,
            played: false,
            audioID: -1,
            bgm: false
        };
        return audioPro;
    }

    private notLoadAudio(url: string) {
        Debug.warn(`没有播放过 ${url} 这个音频，或者这个音频还没加载出来，所以对这个音频施加的操作，例如停止播放、设置音量等操作是无效的!\n此错误一般不需要处理`);
    }
}

export namespace TweenAudio {
    /**音频播放模式 */
    export enum Model {
        NONE,
        /**按顺序播放音频队列的所有音频，播放完后就停止，此模式下设置单个音频循环播放是无效的 */
        ORDER,
        /**循环播放音频列表的所有音频，即按照压入的顺序逐个播放，播放完一轮后又重新开始新的一轮，一直循环下去，此模式下设置单个音频循环播放是无效的 */
        LOOP,
        /**并行播放音频队列所有音频 */
        PARALLEL
    }
}

/**
 * 实例化 TweenAudio 对象。
 * 此函数需要传入一个音频资源所在资源包名或资源包路径，默认是resources资源包
 * @param bundle 
 * @returns 
 */
export function tweenAudio(bundle: string = resources.name) {
    return TweenAudio.create(bundle);
}