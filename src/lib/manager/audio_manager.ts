import { AudioPlayer } from "$lib";
import type { HitId, InstrumentHit, InstrumentId, InstrumentWithId } from "$lib";
export class AudioManager {

    private audioContext: AudioContext | null = null;
    private hits: Map<HitId, AudioPlayer> = new Map();

    addInstruments(instruments: Map<InstrumentId, InstrumentWithId>) {
        instruments.forEach((config, instrumentId) => {
            config.hitTypes.forEach((hitType, hitId) => {
                let hit: InstrumentHit = { instrumentId, hitId }
                this.hits.set(
                    hit.hitId,
                    new AudioPlayer(hitType.audioPath)
                )
            })
        })
        // console.log(`Players: ${JSON.stringify(Array.from(this.hits))}`)
    }

    playHit(hit: InstrumentHit) {
        if (hit.hitId == undefined) return
        let player = this.hits.get(hit.hitId)
        if (player){
            player.play()
        } else {
            console.error(`Can't play ${hit.hitId}, as no player. ExistingPlayers: `)
            console.error(this.hits)
        }
    }

    async initInstruments() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        for (let [hit, player] of this.hits) {
            if (!player.isLoaded()) await player.loadAudio(this.audioContext);
        }
        console.log("Instruments initialised")
    }
}
