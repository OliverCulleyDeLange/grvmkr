import { SvelteMap } from "svelte/reactivity";
import type { InstrumentConfig, InstrumentHit, InstrumentId } from "./types";
import { AudioManager } from "./audio_manager";

// Responsible for modifying and playing instruments
export class InstrumentManager {
    
    private audioManager = new AudioManager()

    public instruments: SvelteMap<InstrumentId, InstrumentConfig> = $state(new SvelteMap())
    
    constructor(instruments: Array<InstrumentConfig>) {
        instruments.forEach((instrument) => {
            let key = `${instrument.name}_${crypto.randomUUID()}`
            this.instruments.set(key, instrument)
        })
        this.audioManager.addInstruments(this.instruments)
    }

    playHit(hit: InstrumentHit){
        this.audioManager.playHit(hit)
    }
    
    initInstruments() {
        this.audioManager.initInstruments()
    }
    
    onChangeName(name: string, id: InstrumentId): any {
        let instrument = this.instruments.get(id)
        if (instrument) {
            instrument.name = name
        }
        // FIXME Super hacky workaround to make the map changes reactive. 
        let newMap = new SvelteMap(this.instruments)
        this.instruments = newMap
    }
}