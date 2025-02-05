import { AudioPlayer } from "$lib";
import type { HitId, HitTypeWithId, InstrumentHit, InstrumentId, InstrumentWithId } from "$lib";
import { AudioDb } from "$lib";

// Maintains a collection of playable 'hits',
// which are samples that an instrument can plan
export class AudioManager {

    private audioContext: AudioContext | null = null;
    private audioDb = new AudioDb()

    private hits: Map<HitId, AudioPlayer> = new Map();

    isHitInitialised(hit: InstrumentHit): boolean {
        let player = this.hits.get(hit.hitId)
        return player != undefined && player.isLoaded()
    }

    // Loads the sample from the DB and initialises an Audio Player with the blob URL
    async initialiseHit(hit: HitTypeWithId) {
        this.ensureAudioContext()

        let audioFileName = hit.audioFileName;
        let fileName = await this.audioDb.loadAudio(audioFileName)
        let player = new AudioPlayer(fileName)
        
        if (!player.isLoaded()) {
            await player.loadAudio(this.audioContext!);
        }

        this.hits.set(hit.id, player)
    }

    async ensureAllAudioInitialised() {
        this.ensureAudioContext()
        for (let [hit, player] of this.hits) {
            if (!player.isLoaded()) await player.loadAudio(this.audioContext!);
        }
    }

    playHit(hit: InstrumentHit) {
        if (hit.hitId == undefined) return
        let player = this.hits.get(hit.hitId)
        if (player) {
            player.play()
        } else {
            console.error(`Can't play ${hit.hitId}, as no player. ExistingPlayers: `, this.hits)
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
