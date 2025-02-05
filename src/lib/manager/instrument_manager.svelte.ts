import { SvelteMap } from "svelte/reactivity";
import type { HitId, HitType, HitTypeWithId, InstrumentConfig, InstrumentHit, InstrumentId, InstrumentWithId, SavedInstrumentV1 } from "$lib";
import { AudioManager, InstrumentService } from "$lib";
import { AudioDb } from "$lib/db/audio_db";
import { defaultInstruments } from "$lib/audio/default_instruments";

// Responsible for modifying and playing instruments
export class InstrumentManager {

    private audioManager = new AudioManager()
    private audioDb: AudioDb = new AudioDb();
    private instrumentService: InstrumentService = new InstrumentService();

    public instruments: SvelteMap<InstrumentId, InstrumentWithId> = new SvelteMap()

    // Populate instruments state from db, defaulting to default config
    // Also downloads default sound files
    async initialise() {
        let instruments = await this.instrumentService.getAllInstruments()
        if (instruments.length == 0) {
            defaultInstruments.forEach((instrument) => this.addInstrumentFromConfig(instrument))
            this.downloadDefaultAudioFiles();
        } else {
            instruments.forEach((instrument) => this.saveInstrumentToStateAndDb(instrument))
        }
    }

    async playHit(hit: InstrumentHit | undefined) {
        if (hit) {
            if (!this.audioManager.isHitInitialised(hit)) {
                let instrument = this.instruments.get(hit.instrumentId)
                let hitType = instrument?.hitTypes.get(hit.hitId)
                if (hitType) {
                    try {
                        await this.audioManager.initialiseHit(hitType)
                        this.audioManager.playHit(hit)
                    } catch (e) {
                        if (e == "loadAudio: onsuccess but no result") {
                            console.error("Sound file not present in database. Removing existing sample", e)
                            hitType.audioFileName = ""
                        } else {
                            console.error("Unhandled error when loading uninitialised instrument hit:", e)
                        }
                    }
                } else {
                    console.error(`Can't play hit as audio not initialised and instrument with id ${hit.instrumentId} with hit with id ${hit.hitId} doesn't exist in instrument manager`)
                }
            } else {
                this.audioManager.playHit(hit)
            }
        }
    }

    async play(instrumentId: InstrumentId, hitId: HitId) {
        await this.playHit({ instrumentId, hitId })
    }

    ensureInstrumentsInitialised() {
        this.audioManager.ensureAllAudioInitialised()
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

    // Adds instruments from config, generating a new ID
    addInstrumentFromConfig(instrument: InstrumentConfig) {
        let instrumentId = `instrument_${crypto.randomUUID()}`
        let hitMap = new SvelteMap(instrument.hitTypes.map((hit) => {
            let hitWithId: HitTypeWithId = this.buildReactiveHitFromConfig(hit);
            return [hitWithId.id, hitWithId];
        }));
        this.addInstrument(instrumentId, hitMap, instrument.name, instrument.gridIndex);
    }

    // Saves a reactive instrument in state and db
    addInstrument(
        instrumentId: string,
        hitMap: SvelteMap<string, HitTypeWithId>,
        name: string,
        index: number
    ) {
        let instrument: InstrumentWithId = {
            id: instrumentId,
            hitTypes: hitMap,
            gridIndex: index,
            name: name
        };
        this.saveInstrumentToStateAndDb(instrument);
    }

    private saveInstrumentToStateAndDb(instrument: InstrumentWithId) {
        // Save a reactive version to state
        let reactiveInstrument = $state(instrument)
        this.instruments.set(instrument.id, reactiveInstrument);
        // Persist non reactive version in DB
        this.instrumentService.saveInstrument(instrument)
    }

    // Adds a new hit to the instrument, generating a new id
    addHit(hit: HitType, instrumentId: InstrumentId) {
        let reactiveHitWithId = this.buildReactiveHitFromConfig(hit)
        let instrument = this.instruments.get(instrumentId)
        if (instrument) {
            instrument.hitTypes.set(reactiveHitWithId.id, reactiveHitWithId)
            this.instrumentService.saveInstrument(instrument)
        }
    }

    removeInstrument(id: InstrumentId) {
        this.instruments.delete(id)
        this.instrumentService.deleteInstrument(id)
    }

    removeHit(instrumentId: InstrumentId, hitId: HitId) {
        let updatedInstrument = this.updateInstrument(instrumentId, (instrument) => {
            instrument.hitTypes.delete(hitId)
        })
        this.audioManager.removeHit(hitId)
        if (updatedInstrument) {
            this.instrumentService.saveInstrument(updatedInstrument)
        }
    }

    // When loading from file, replace all instruments
    replaceInstruments(instruments: SavedInstrumentV1[]) {
        this.reset()
        instruments.forEach((instrument, index) => {
            let hitMap = new SvelteMap(instrument.hits.map((hit) => {
                let hitType: HitType = {
                    key: hit.key,
                    description: hit.description,
                    audioFileName: hit.audio_file_name
                }
                let hitWithId: HitTypeWithId = this.createReactiveHitWithId(hit.id, hitType);
                return [hitWithId.id, hitWithId];
            }));
            this.addInstrument(instrument.id, hitMap, instrument.name, index);
        })
    }

    private reset() {
        this.instruments.clear()
        this.audioManager.reset()
        this.instrumentService.deleteAllInstruments()
    }

    private buildReactiveHitFromConfig(hit: HitType): HitTypeWithId {
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

    private updateInstrument(id: InstrumentId, callback: (config: InstrumentWithId) => void): InstrumentWithId | undefined {
        let instrument = this.instruments.get(id)
        if (instrument) {
            callback(instrument)
            this.instrumentService.saveInstrument(instrument)
        } else {
            console.error(`Couldn't update instrument ${id} as it doesn't exist`)
        }
        return instrument
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

    // Downloads default audio files if they don't exist in the db already
    private downloadDefaultAudioFiles() {
        this.instruments.forEach((instrument) => {
            instrument.hitTypes.forEach((hit) => {
                this.audioDb.audioExists(hit.audioFileName)
                    .then((exists) => {
                        if (!exists) {
                            console.log("Downloading default audio file", hit.audioFileName);
                            fetch(`./${hit.audioFileName}`)
                                .then((res) => {
                                    res.blob()
                                        .then((blob) => {
                                            const file = new File([blob], hit.audioFileName, { type: blob.type });
                                            this.audioDb.storeAudio(file);
                                        });
                                });
                        }
                    });
            });
        });
    }
}