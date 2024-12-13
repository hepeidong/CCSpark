import { AudioClip, AudioSource } from "cc";
import { STARTUP, SAFE_CALLBACK } from "../Define";
import { Assert } from "../exceptions/Assert";
import { tools } from "../tools";

type AudioContainer<T> = {[n: number]: T;}

export class AudioEngine {
    private audioIDIndex: number = 0;
    private _bgmID: number;
    private _audioBGM: AudioSource;
    private _audioAll: AudioContainer<AudioSource>;
    private _audioBGMCallback: Function;
    private _audioFinishCallbacks: AudioContainer<Function>;
    private _audioPool: tools.ObjectPool<AudioSource>;

    constructor() {
        this._bgmID = -1;
        this._audioBGM = new AudioSource(STARTUP.name + "BGM");
        this._audioAll = {};
        this._audioFinishCallbacks = {};
        this._audioPool = new tools.ObjectPool();
    }

    private getAudioID() {
        return this.audioIDIndex === Number.MAX_VALUE ? 0: this.audioIDIndex++;
    }

    private hasAudio(audioID: number) {
        const flag = audioID in this._audioAll;
        return Assert.handle(Assert.Type.AudioSourceIDException, flag, audioID.toString())
    }

    public stopAll() {
        this._audioBGM.stop();
        const audioAll = this._audioAll;
        for (const k in audioAll) {
            const audio = this._audioAll[k];
            audio.stop();
        }
    }

    /**游戏进入后台的音频处理 */
    public backgroundJob() {
        this._audioBGM.pause();
        const audioAll = this._audioAll;
        for (const k in audioAll) {
            const audio = audioAll[k];
            audio.pause();
        }
    }

    /**游戏进入前台的音频处理 */
    public foregroundJob() {
        if (this._audioBGM.state === AudioSource.AudioState.PAUSED || this._audioBGM.state === AudioSource.AudioState.INTERRUPTED) {
            this._audioBGM.play();
        }
        const audioAll = this._audioAll;
        for (const k in audioAll) {
            const audio = audioAll[k];
            if (audio.state === AudioSource.AudioState.PAUSED || audio.state === AudioSource.AudioState.INTERRUPTED) {
                audio.play();
            }
        }
    }

    public setVolume(audioID: number, volume: number) {
        if (audioID === this._bgmID) {
            this._audioBGM.volume = volume;
        }
        else if (this.hasAudio(audioID)) {
            this._audioAll[audioID].volume = volume;
        }
    }

    public getVolume(audioID: number) {
        if (audioID === this._bgmID) {
            return this._audioBGM.volume;
        }
        if (this.hasAudio(audioID)) {
            return this._audioAll[audioID].volume;
        }
        return 0;
    }

    public setLoop(audioID: number, loop: boolean) {
        if (audioID === this._bgmID) {
            this._audioBGM.loop = loop;
        }
        else if (this.hasAudio(audioID)) {
            this._audioAll[audioID].loop = loop;
        }
    }

    public isLoop(audioID: number) {
        if (audioID === this._bgmID) {
            return this._audioBGM.loop;
        }
        if (this.hasAudio(audioID)) {
            return this._audioAll[audioID].loop;
        }
        return false;
    }

    public pause(audioID: number) {
        if (audioID === this._bgmID) {
            this._audioBGM.pause();
        }
        else if (this.hasAudio(audioID)) {
            this._audioAll[audioID].pause();
        }
    }

    public resume(audioID: number) {
        if (audioID === this._bgmID) {
            this._audioBGM.play();
        }
        else if (this.hasAudio(audioID)) {
            this._audioAll[audioID].play();
        }
    }

    public stop(audioID: number) {
        if (audioID === this._bgmID) {
            this._audioBGM.stop();
        }
        else if (this.hasAudio(audioID)) {
            this._audioAll[audioID].stop();
        }
    }

    /**
     * 播放背景音乐，背景音乐有且只有一个会处于播放中，背景音乐播放时，允许其他音频与背景音乐叠加
     * @param clip 
     * @param loop 
     * @param volume 
     * @returns 
     */
    public playBGM(clip: AudioClip, loop: boolean, volume: number) {
        if (this._audioBGM.playing) {
            this._audioBGM.stop();
        }
        this._audioBGM.clip = clip;
        this._audioBGM.loop = loop;
        this._audioBGM.volume = volume;
        const time = this._audioBGM.duration - this._audioBGM.currentTime;
        this._audioBGM.play();
        this._audioBGM.scheduleOnce(() => {
            SAFE_CALLBACK(this._audioBGMCallback);
        }, time);
        return this._bgmID;
    }

    /**
     * 播放音频，此接口播放音频时，不会关闭当前正在播放的音频
     * @param clip 
     * @param loop 
     * @param volume 
     * @returns 
     */
    private createAudioSource(clip: AudioClip, loop: boolean, volume: number) {
        let newAudio: AudioSource;
        if (this._audioPool.size() > 0) {
            newAudio = this._audioPool.get();
        }
        else {
            newAudio = new AudioSource();
        }
        newAudio.name = clip.name;
        newAudio.currentTime = 0;
        newAudio.clip = clip;
        newAudio.loop = loop;
        newAudio.volume = volume;
        const audioID = this.getAudioID();
        this._audioAll[audioID] = newAudio;
        return audioID;
    }

    /**
     * 播放音乐，此接口播放音乐时，会关闭当前正在播放的音频
     * @param clip 
     * @param loop 
     * @param volume 
     * @returns 
     */
    public playMusic(clip: AudioClip, loop: boolean, volume: number) {
        this._audioBGM.pause();
        const audioAll = this._audioAll;
        for (const k in audioAll) {
            const audio = audioAll[k];
            audio.pause();
        }
        const audioID = this.createAudioSource(clip, loop, volume);
        const newAudio = this._audioAll[audioID];
        const time = newAudio.duration - newAudio.currentTime;
        newAudio.play();
        newAudio.scheduleOnce(() => {
            const callback = this._audioFinishCallbacks[audioID];
            SAFE_CALLBACK(callback);
            this._audioPool.put(newAudio);
            delete this._audioAll[audioID];
            if (audioID in this._audioFinishCallbacks) {
                delete this._audioFinishCallbacks[audioID];
            }
            this._audioBGM.play();
            const audioAll = this._audioAll;
            for (const k in audioAll) {
                const audio = audioAll[k];
                audio.play();
            }
        }, time);
        return audioID;
    }

    /**
     * 播放音效
     * @param clip 
     * @param loop 
     * @param volume 
     * @returns 
     */
    public playEffect(clip: AudioClip, loop: boolean, volume: number) {
        const audioID = this.createAudioSource(clip, loop, volume);
        const newAudio = this._audioAll[audioID];
        const time = newAudio.duration - newAudio.currentTime;
        if (loop) {
            newAudio.play();
        }
        else {
            newAudio.playOneShot(clip);
        }
        newAudio.scheduleOnce(() => {
            const callback = this._audioFinishCallbacks[audioID];
            SAFE_CALLBACK(callback);
            this._audioPool.put(newAudio);
            delete this._audioAll[audioID];
            if (audioID in this._audioFinishCallbacks) {
                delete this._audioFinishCallbacks[audioID];
            }
        }, time);
        return audioID;
    }

    public setFinishCallback(audioID: number, callback: Function) {
        if (audioID === this._bgmID) {
            this._audioBGMCallback = callback;
        }
        else {
            this._audioFinishCallbacks[audioID] = callback;
        }
    }

    public getCurrentTime(audioID: number) {
        if (audioID === this._bgmID) {
            return this._audioBGM.currentTime;
        }
        if (this.hasAudio(audioID)) {
            return this._audioAll[audioID].currentTime;
        }
        return 0;
    }

    public getDuration(audioID: number) {
        if (audioID === this._bgmID) {
            return this._audioBGM.duration;
        }
        if (this.hasAudio(audioID)) {
            return this._audioAll[audioID].duration;
        }
        return 0;
    }
}