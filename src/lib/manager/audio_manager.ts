import { AudioPlayer } from "$lib";
import type { HitId, HitTypeWithId, InstrumentHit, InstrumentId, InstrumentWithId } from "$lib";
import { AudioDb } from "$lib";
export class AudioManager {

    private audioContext: AudioContext | null = null;
    private hits: Map<HitId, AudioPlayer> = new Map();
    private audioDb = new AudioDb()

    isHitInitialised(hit: InstrumentHit): boolean {
        let player = this.hits.get(hit.hitId)
        return player != undefined && player.isLoaded()
    }

    setupInstrumentAudioPlayers(instruments: Map<InstrumentId, InstrumentWithId>) {
        instruments.forEach((instrument, instrumentId) => {
            this.setupInstrumentAudioPlayer(instrument)
        })
    }

    setupInstrumentAudioPlayer(instruments: InstrumentWithId) {
        instruments.hitTypes.forEach((hitType, hitId) => {
            this.setupHitAudioPlayer(hitType)
        })
    }

    // Loads the sample from the DB and initialises an Audio Player with the blob URL
    async setupHitAudioPlayer(hit: HitTypeWithId) {
        let audioFileName = hit.audioFileName;
        console.log(`Setting up AudioPlayer for ${hit.audioFileName}`)
        let sampleUrl = await this.audioDb.loadAudio(audioFileName)
        this.hits.set(hit.id, new AudioPlayer(sampleUrl))
        console.log(`Setup AudioPlayer for ${hit.audioFileName}`)
    }

    // We can't use audio context until a user event has fired, this is why this is not done at the start
    async loadAllHitAudio() {
        this.ensureAudioContext()
        for (let [hit, player] of this.hits) {
            if (!player.isLoaded()) await player.loadAudio(this.audioContext!);
        }
        console.log("All instrument audio loaded")
    }

    async loadHitAudio(hitId: HitId) {
        this.ensureAudioContext()
        let hitAudioPlayer: AudioPlayer | undefined = this.hits.get(hitId)
        if (hitAudioPlayer) {
            if (!hitAudioPlayer.isLoaded()) {
                await hitAudioPlayer.loadAudio(this.audioContext!);
            }
        }
    }

    playHit(hit: InstrumentHit) {
        if (hit.hitId == undefined) return
        let player = this.hits.get(hit.hitId)
        if (player) {
            player.play()
        } else {
            console.error(`Can't play ${hit.hitId}, as no player. ExistingPlayers: `)
            console.error(this.hits)
        }
    }

    removeHit(hitId: HitId) {
        this.hits.delete(hitId)
    }

    reset() {
        this.hits.clear()
    }

    private ensureAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
}
