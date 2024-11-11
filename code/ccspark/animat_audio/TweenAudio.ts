import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { Assert } from "../exceptions/Assert";
import { cc_spark_audio_saudio_resolved_type, cc_spark_audio_type, IAudio, IAudioBGM, ILoader, ITweenAudio } from "../lib.ccspark";
import { AudioClip, resources } from "cc";
import { AudioEngine } from "./AudioEngine";
import { Res } from "../res/Res";
import { tools } from "../tools";


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
    private _order: boolean;
    private _bundle: string;
    private _audioList: string[];
    private _rejected: Function;
    private static _audioEngine: AudioEngine = new AudioEngine();
    private static _audioPool: Map<string, cc_spark_audio_type> = new Map();
 
    constructor(bundle: string) {
        this._bundle = bundle;
        this._status = 'pending';
        this._audioIndex = 0;
        this._audioCount = 0;
        this._canPlay = false;
        this._order = false;
        this._audioList = [];
    }

    public static create(bundle: string = resources.name): ITweenAudio {
        return new TweenAudio(bundle);
    }

    public static get audioEngine() { return this._audioEngine; }

    static stopAll() {
        this.audioEngine.stopAll();
    }

    public set volume(v: number) {
        let audioPro: cc_spark_audio_type = TweenAudio._audioPool.get(this._audioList[this._audioIndex]);
        if (audioPro && audioPro.audioID > -1) {
            TweenAudio.audioEngine.setVolume(audioPro.audioID, v);
        }
        else {
            this.notLoadAudio();
        }
    }

    public get volume(): number {
        if (this._audioCount > 1) {
            this._status = 'rejected';
            this._err = new Error('不能同时获取多个音频的音量!');
        }
        else {
            let audioPro: cc_spark_audio_type = TweenAudio._audioPool.get(this._audioList[this._audioIndex]);
            if (audioPro && audioPro.audioID > -1) {
                return TweenAudio.audioEngine.getVolume(audioPro.audioID);
            }
            else {
                this.notLoadAudio();
            }
        }
        return -1;
    }

    public set loop(l: boolean) {
        let audioPro: cc_spark_audio_type = TweenAudio._audioPool.get(this._audioList[this._audioIndex]);
        if (audioPro && audioPro.audioID > -1) {
            TweenAudio.audioEngine.setLoop(audioPro.audioID, l);
        }
        else {
            this.notLoadAudio();
        }
    }

    public get loop(): boolean {
        if (this._audioCount > 1) {
            this._status = 'rejected';
            this._err = new Error('不能同时获取多个音频的循环状态!');
        }
        else {
            let audioPro: cc_spark_audio_type = TweenAudio._audioPool.get(this._audioList[this._audioIndex]);
            if (audioPro && audioPro.audioID > -1) {
                return TweenAudio.audioEngine.isLoop(audioPro.audioID);
            }
            else {
                this.notLoadAudio();
            }
        }
        return false;
    }

    /**
     * 设置音频播放模式
     * @param order 是否顺序播放,true为顺序播放,默认值为false
     */
    public audio(order: boolean = false): TweenAudio {
        this._order = order;
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
            this._audioCount++;
            if (TweenAudio._audioPool.has(props.url)) {
                TweenAudio._audioPool.get(props.url).audio = props;
            }
            else {
                TweenAudio._audioPool.set(props.url, this.bgmProps(props));
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
            this._audioCount++;
            if (TweenAudio._audioPool.has(props.url)) {
                TweenAudio._audioPool.get(props.url).audio = props;
            }
            else {
                TweenAudio._audioPool.set(props.url, this.effectProps(props));
            }
            this.audioLoaded(props);
        }
        return this;
    }
    
    /**
     * 播放音频时要执行的回调
     * @param callType 回调类型
     * @param resolve 执行的回调
     */
    public when<T extends 'play'|'stop', P = T extends 'play'|'stop' ? (currentTime: number) => void : (duration: number) => void>(callType: T, resolve: P): TweenAudio {
        let len: number = this._audioList.length;
        if (len === 0) {
            this._status = 'rejected';
            this._err = new Error('必须先指定播放哪个音频！');
        }
        else {
            let key: string = this._audioList[len - 1];
            TweenAudio._audioPool.get(key).callbacks.push({type: callType, call: resolve});
        }
        return this;
    }

    /**
     * 抛出异常
     * @param reject 
     */
    public cath(reject: (e: Error) => void): ITweenAudio {
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

    /**开始播放音频 */
    public play(): TweenAudio {
        this._canPlay = true;
        if (this._audioList.length === this._audioCount) {
            this.tryPlay();
        }
        return this;
    }

    public pause(): TweenAudio {
        for (let i: number = 0; i < this._audioList.length; ++i) {
            let audioPro: cc_spark_audio_type = TweenAudio._audioPool.get(this._audioList[i]);
            if (audioPro && audioPro.audioID > -1) {
                TweenAudio.audioEngine.pause(audioPro.audioID);
            }
            else {
                this.notLoadAudio();
            }
        }
        return this;
    }

    public resume(): TweenAudio {
        for (let i: number = 0; i < this._audioList.length; ++i) {
            let audioPro: cc_spark_audio_type = TweenAudio._audioPool.get(this._audioList[i]);
            if (audioPro && audioPro.audioID > -1) {
                TweenAudio.audioEngine.resume(audioPro.audioID);
            }
            else {
                this.notLoadAudio();
            }
        }
        return this;
    }

    public stop(): TweenAudio {
        this._canPlay = false;
        if (this._audioList.length === this._audioCount) {
            this.tryPlay();
        }
        return this;
    }

    private stopAudio() {
        for (let i: number = 0; i < this._audioList.length; ++i) {
            let audioPro: cc_spark_audio_type = TweenAudio._audioPool.get(this._audioList[i]);
            
            if (audioPro && audioPro.audioID > -1) {
                TweenAudio.audioEngine.stop(audioPro.audioID);
            }
            else {
                this.notLoadAudio();
            }
        }
    }

    private tryPlay(): void {
        if (this._audioList.length === this._audioCount && this._canPlay) {
            try {
                if (this._status === 'pending') {
                    if (this._order) {
                        this.playInterval();
                    }
                    else {
                        this.playAudio();
                    }
                }
            } catch (error) {
                this._status = 'rejected';
                this._err = error;
                this.callRejected();
            }
        }
        else if (this._audioList.length === this._audioCount && !this._canPlay) {
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
        const clip = await this.awaitLoad(props.url).catch((e) => {
            this._status = e;
            this.callRejected();
        });
        if (clip) {
            this._audioList.push(props.url);
            TweenAudio._audioPool.has(props.url) && (TweenAudio._audioPool.get(props.url).clip = clip);
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
        this._status = 'pending';
        this._audioIndex = 0;
        this._audioCount = 0;
        this._canPlay = false;
        this._order = false;
        this._audioList.splice(0, this._audioList.length);
    }
    /**一次性播放队列所有音频 */
    private playAudio() {
        for (let i: number = 0; i < this._audioList.length; ++i) {
            let key: string = this._audioList[i];
            let audioPro: cc_spark_audio_type = TweenAudio._audioPool.get(key);
            let audioID: number;
            if (audioPro.bgm) {
                if ((audioPro.audio as IAudioBGM).superpose) {
                    audioID = TweenAudio.audioEngine.playBGM(audioPro.clip, audioPro.audio.loop, audioPro.audio.volume);
                }
                else {
                    audioID = TweenAudio.audioEngine.playMusic(audioPro.clip, audioPro.audio.loop, audioPro.audio.volume);
                }
            }
            else {
                audioID = TweenAudio.audioEngine.playEffect(audioPro.clip, audioPro.audio.loop, audioPro.audio.volume);
            }
            audioPro.audioID = audioID;
            TweenAudio._audioPool.set(key, audioPro);
            //设置音频结束后的回调
            TweenAudio.audioEngine.setFinishCallback(audioID, () => this.onFinishCallback(audioPro, audioID));
            for (let e of audioPro.callbacks) {
                if (e.type === 'play') {
                    SAFE_CALLBACK(e.call, TweenAudio.audioEngine.getCurrentTime(audioID));
                }
            }
        }
    }
    //非顺序播放模式下,每个音频结束的回调
    private onFinishCallback(audioPro: cc_spark_audio_type, audioID: number) {
        for (let e of audioPro.callbacks) {
            if (e.type === 'stop') {
               SAFE_CALLBACK(e.call, TweenAudio.audioEngine.getDuration(audioID));
            }
        }
        TweenAudio.audioEngine.stop(audioID);
    }
    //顺序播放模式下每个音频结束的回调
    private onFinishCallbackInOrder(audioPro: cc_spark_audio_type, audioID: number) {
        for (let e of audioPro.callbacks) {
            if (e.type === 'stop') {
               SAFE_CALLBACK(e.call, TweenAudio.audioEngine.getDuration(audioID));
            }
        }
        this._audioIndex++;
        if (this._audioIndex < this._audioList.length) {
            this.playInterval();
        }
        else {
            this.reset();
        }
        TweenAudio.audioEngine.stop(audioID);
    }
    /**按顺序播放音频 */
    private playAudioInOrder(resolves: cc_spark_audio_saudio_resolved_type[]) {
        let key: string = this._audioList[this._audioIndex];
        let audioPro: cc_spark_audio_type = TweenAudio._audioPool.get(key);
        let audioID: number;
        if (audioPro.bgm) {
            if ((audioPro.audio as IAudioBGM).superpose) {
                audioID = TweenAudio.audioEngine.playBGM(audioPro.clip, audioPro.audio.loop, audioPro.audio.volume);
            }
            else {
                audioID = TweenAudio.audioEngine.playMusic(audioPro.clip, audioPro.audio.loop, audioPro.audio.volume);
            }
        }
        else {
            audioID = TweenAudio.audioEngine.playEffect(audioPro.clip, audioPro.audio.loop, audioPro.audio.volume);
        }
        audioPro.audioID = audioID;
        TweenAudio._audioPool.set(key, audioPro);
        //设置音频结束后的回调
        TweenAudio.audioEngine.setFinishCallback(audioID, () => this.onFinishCallbackInOrder(audioPro, audioID));
        for (let e of resolves) {
            if (e.type === 'play') {
                SAFE_CALLBACK(e.call, TweenAudio.audioEngine.getCurrentTime(audioID));
            }
        }
    }

    private playInterval() {
        let key: string = this._audioList[this._audioIndex];
        let audioPro: cc_spark_audio_type = TweenAudio._audioPool.get(key);

        tools.Timer.setInterval(() => {
            this.playAudioInOrder(TweenAudio._audioPool.get(this._audioList[this._audioIndex]).callbacks);
        }, audioPro.audio.delay);
    }

    private bgmProps(props: IAudioBGM): cc_spark_audio_type {
        let audioPro: cc_spark_audio_type = {
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

    private effectProps(props: IAudio): cc_spark_audio_type {
        let audioPro: cc_spark_audio_type = {
            audio: {
                url: props.url,
                loop: (props.loop === undefined || props.loop === null) ? false : props.loop,
                volume: (props.volume === null || props.volume === undefined) ? 1 : props.volume,
                delay: props.delay ? props.delay : 0
            }, 
            callbacks: [],
            clip: null,
            played: false,
            audioID: -1,
            bgm: false
        };
        return audioPro;
    }

    private notLoadAudio() {
        this._status = 'rejected';
        this._err = new Error('没有播放过这个音频,或者没有加载过这个音频!');
        this.callRejected();
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