import { SvelteMap } from "svelte/reactivity";
import type { HitId, HitType, HitTypeWithId, InstrumentConfig, InstrumentHit, InstrumentId, InstrumentWithId, SavedInstrumentV1 } from "$lib";
import { AudioManager, mapSavedInstrumentToInstrumentConfig } from "$lib";
import { AudioDb } from "$lib/db/audio_db";

// Responsible for modifying and playing instruments
export class InstrumentManager {

    private audioManager = new AudioManager()
    private audioDb: AudioDb = new AudioDb();

    public instruments: SvelteMap<InstrumentId, InstrumentWithId> = new SvelteMap()
    public numberOfHits: number = $derived([...this.instruments.values()]
        .reduce((acc, instrument) => acc + instrument.hitTypes.size, 0))

    // Populate instruments state with given config
    // Save audio files into indexedDB
    constructor(instrumentConfigs: Array<InstrumentConfig>) {
        instrumentConfigs.forEach((instrument) => this.addInstrumentFromConfig(instrument))

        // Get the default sound files
        // TODO Check if they exist before doing this
        this.instruments.forEach((instrument) => {
            instrument.hitTypes.forEach((hit) => {
                fetch(`./${hit.audioFileName}`)
                    .then((res) => {
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
            if (!this.audioManager.isHitInitialised(hit)) {
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

    addInstrumentFromConfig(instrument: InstrumentConfig) {
        let instrumentId = `instrument_${crypto.randomUUID()}`
        this.addInstrument(instrument, instrumentId);
    }


    addInstrument(instrument: InstrumentConfig, instrumentId: string) {
        let hitMap = new SvelteMap(instrument.hitTypes.map((hit) => {
            let hitWithId: HitTypeWithId = this.buildHit(hit);
            return [hitWithId.id, hitWithId];
        }));
        this.addReactiveInstrument(instrumentId, hitMap, instrument.name, instrument.gridIndex);
    }

    addReactiveInstrument(
        instrumentId: string,
        hitMap: SvelteMap<string, HitTypeWithId>,
        name: string,
        index: number
    ) {
        let reactiveInstrument: InstrumentWithId = $state({
            id: instrumentId,
            hitTypes: hitMap,
            gridIndex: index,
            name: name
        });
        this.instruments.set(instrumentId, reactiveInstrument);
    }

    removeInstrument(id: InstrumentId) {
        this.instruments.delete(id)
    }

    addHit(hit: HitType, instrumentId: InstrumentId) {
        let hitWithId = this.buildHit(hit)
        this.instruments.get(instrumentId)?.hitTypes.set(hitWithId.id, hitWithId)
    }

    removeHit(instrumentId: InstrumentId, hitId: HitId) {
        this.updateInstrument(instrumentId, (instrument) => {
            instrument.hitTypes.delete(hitId)
        })
        this.audioManager.removeHit(hitId)
    }

    // When loading from file, replace all instruments
    replaceInstruments(instruments: SavedInstrumentV1[]) {
        this.reset()
        instruments.forEach((instrument, index) => {
            // let config: InstrumentConfig = mapSavedInstrumentToInstrumentConfig(instrument, index)
            // this.addInstrument(config, instrument.id)

            let hitMap = new SvelteMap(instrument.hits.map((hit) => {
                let hitType: HitType = {
                    key: hit.key,
                    description: hit.description,
                    audioFileName: hit.audio_file_name
                }
                let hitWithId: HitTypeWithId = this.createReactiveHitWithId(hit.id, hitType);
                return [hitWithId.id, hitWithId];
            }));
            this.addReactiveInstrument(instrument.id, hitMap, instrument.name, index);
        })
    }

    private reset() {
        this.instruments.clear()
        this.audioManager.reset()
    }

    private buildHit(hit: HitType): HitTypeWithId {
        let hitId = `hit_${crypto.randomUUID()}`
        return this.createReactiveHitWithId(hitId, hit);
    }

    private createReactiveHitWithId(hitId: string, hit: HitType): HitTypeWithId {
        let hitWithId: HitTypeWithId = {
            id: hitId,
            key: hit.key,
            description: hit.description,
            audioFileName: hit.audioFileName
        };
        let reactiveHit = $state(hitWithId);
        return reactiveHit;
    }

    private updateInstrument(id: InstrumentId, callback: (config: InstrumentWithId) => void) {
        let instrument = this.instruments.get(id)
        if (instrument) {
            callback(instrument)
        } else {
            console.error(`Couldn't update instrument ${id} as it doesn't exist`)
        }
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