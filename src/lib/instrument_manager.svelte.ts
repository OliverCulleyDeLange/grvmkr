import { SvelteMap } from "svelte/reactivity";
import type { InstrumentConfig, InstrumentId } from "./types";

export class InstrumentManager {
    public instruments: SvelteMap<InstrumentId, InstrumentConfig> = $state(new SvelteMap())
    
    constructor(instruments: Array<InstrumentConfig>) {
        instruments.forEach((instrument) => {
            let key = `${instrument.name}_${crypto.randomUUID()}`
            this.instruments.set(key, instrument)
        })
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