import { SvelteMap } from "svelte/reactivity";
import type { HitId, HitType, InstrumentConfig, InstrumentHit, InstrumentId, InstrumentWithId } from "./types";
import { AudioManager } from "./audio_manager";

// Responsible for modifying and playing instruments
export class InstrumentManager {

    private audioManager = new AudioManager()

    public instruments: SvelteMap<InstrumentId, InstrumentWithId> = $state(new SvelteMap())

    constructor(instrumentConfigs: Array<InstrumentConfig>) {
        instrumentConfigs.forEach((instrument) => {
            let instrumentId = `${instrument.name}_${crypto.randomUUID()}`
            let hitMap = new Map(instrument.hitTypes.map((hit) => {
                let hitId = `${hit.key}_${instrument.name}_${crypto.randomUUID()}`
                let hitWithId = {
                    id: hitId,
                    key: hit.key,
                    description: hit.description,
                    audioPath: hit.audioPath
                }
                return [hitId, hitWithId]
            }))
            this.instruments.set(instrumentId, {
                id: instrumentId,
                hitTypes: hitMap,
                gridIndex: instrument.gridIndex,
                name: instrument.name
            })
        })
        this.audioManager.addInstruments(this.instruments)
    }

    playHit(hit: InstrumentHit | undefined) {
        if (hit) this.audioManager.playHit(hit)
    }

    initInstruments() {
        this.audioManager.initInstruments()
    }

    onChangeName(name: string, id: InstrumentId): any {
        this.updateInstrument(id, (instrument) => {
            instrument.name = name
        })
    }

    onChangeHitKey(value: string, instrumentId: InstrumentId, hitId: HitId) {
        this.updateInstrumentHit(instrumentId, hitId, (hit) => {
            hit.key = value
        })
    }

    onChangeHitDescription(value: string, instrumentId: InstrumentId, hitId: HitId) {
        this.updateInstrumentHit(instrumentId, hitId, (hit) => {
            hit.description = value
        })
    }

    private updateInstrument(id: InstrumentId, callback: (config: InstrumentWithId) => void) {
        let instrument = this.instruments.get(id)
        if (instrument) {
            callback(instrument)
        } else {
            console.error(`Couldn't update instrument ${id} as it doesn't exist`)
        }
        // FIXME Super hacky workaround to make the map changes reactive. 
        let newMap = new SvelteMap(this.instruments)
        this.instruments = newMap
    }

    private updateInstrumentHit(instrumentId: InstrumentId, hitId: HitId, callback: (config: HitType) => void) {
        this.updateInstrument(instrumentId, (instrument) => {
            let hit = instrument.hitTypes.get(hitId)
            if (hit) {
                callback(hit)
            } else {
                console.error(`Couldn't update instrument hit ${hitId} as it doesn't exist`)
            }
        })
    }
}