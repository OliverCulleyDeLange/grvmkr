import { SvelteMap } from "svelte/reactivity";
import type { HitId, HitType, InstrumentConfig, InstrumentHit, InstrumentId, InstrumentWithId } from "$lib";
import { AudioManager } from "$lib";
import { AudioDb } from "$lib/db/audio_db";

// Responsible for modifying and playing instruments
export class InstrumentManager {

    private audioManager = new AudioManager()
    private audioDb: AudioDb = new AudioDb();

    public instruments: SvelteMap<InstrumentId, InstrumentWithId> = $state(new SvelteMap())

    // Populate instruments state with given config
    // Save audio files into indexedDB
    constructor(instrumentConfigs: Array<InstrumentConfig>) {
        instrumentConfigs.forEach((instrument) => {
            let instrumentId = `${instrument.name}_${crypto.randomUUID()}`
            let hitMap = new Map(instrument.hitTypes.map((hit) => {
                let hitId = `${hit.key}_${instrument.name}_${crypto.randomUUID()}`
                let hitWithId = {
                    id: hitId,
                    key: hit.key,
                    description: hit.description,
                    audioFileName: hit.audioFileName
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

        this.instruments.forEach((instrument) => {
            instrument.hitTypes.forEach((hit) => {
                fetch(`./${hit.audioFileName}`)
                    .then((res) => {
                        console.log(res)
                        res.blob()
                            .then((blob) => {
                                const file = new File([blob], hit.audioFileName, { type: blob.type });
                                this.audioDb.storeAudio(file)
                            })
                    })
            })
        })
    }

    async playHit(hit: InstrumentHit | undefined) {
        if (hit) {
            if (!this.audioManager.hitInitialised(hit)) {
                let instrument = this.instruments.get(hit.instrumentId)
                let hitType = instrument?.hitTypes.get(hit.hitId)
                if (hitType) {
                    try {
                        await this.audioManager.setupHitAudioPlayer(hitType)
                        await this.audioManager.loadHitAudio(hit.hitId)
                        this.audioManager.playHit(hit)
                    } catch (e) {
                        console.error("Can't setup uninitialised instrument hit. Error:", e)
                    }
                } else {
                    console.error(`Can't play hit as audio not initialised and instrument with id ${hit.instrumentId} with hit with id ${hit.hitId} doesn't exist in instrument manager`)
                }
            } else {
                this.audioManager.playHit(hit)
            }
        }
    }

    play(instrumentId: InstrumentId, hitId: HitId) {
        this.playHit({ instrumentId, hitId })
    }

    initInstruments() {
        this.audioManager.loadAllHitAudio()
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

    async onChangeSample(file: File, instrumentId: InstrumentId, hitId: HitId) {
        let storedFilename = await this.audioDb.storeAudio(file);
        this.updateInstrumentHit(instrumentId, hitId, (hit) => {
            hit.audioFileName = storedFilename
        })
        this.audioManager.removeHit(hitId)
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