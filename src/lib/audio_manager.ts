import { AudioPlayer } from "./audio_player";
import type { InstrumentConfig, InstrumentHit } from "./types";

export class AudioManager {

    private audioContext: AudioContext | null = null;
    private hits: Map<string, AudioPlayer> = new Map();

    addInstruments(instruments: InstrumentConfig[]) {
        instruments.forEach((instrument) => {
            instrument.hitTypes.forEach((hitType) => {
                let hit: InstrumentHit = { instrumentName: instrument.name, hitKey: hitType.key }
                
                this.hits.set(
                    this.getInstrumentHitKey(hit),
                    new AudioPlayer(hitType.audioPath)
                )
                console.log(`Added player for ${JSON.stringify(hit)}`)
            })
        })
        console.log(`Players: ${JSON.stringify(Array.from(this.hits))}`)
    }

    playHit(hit: InstrumentHit) {
        if (hit.hitKey == undefined) return
        let key = this.getInstrumentHitKey(hit)
        let player = this.hits.get(key)
        if (player){
            player.play()
        } else {
            console.error(`Can't play ${hit.instrumentName}_${hit.hitKey}, as no player. ExistingPlayers: ${JSON.stringify(this.hits.keys())}`)
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

    private getInstrumentHitKey(hit: InstrumentHit) {
        return `${hit.instrumentName}_${hit.hitKey}`
    }
}
