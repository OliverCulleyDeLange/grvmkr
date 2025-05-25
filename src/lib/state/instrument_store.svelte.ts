import { SvelteMap } from "svelte/reactivity";
import { AudioDb, defaultInstruments, defaultVolume, InstrumentEvent, type HitId, type HitType, type HitTypeWithId, type InstrumentConfig, type InstrumentHit, type InstrumentId, type InstrumentWithId, type SavedInstrumentV1, type SavedInstrumentV3, type SavedInstrumentV4 } from "$lib";
import { AudioManager, InstrumentService } from "$lib";
import { clamp } from "$lib/util/math";

// Responsible for storing, modifying and playing instruments
export class InstrumentStore {

    private audioManager = new AudioManager()
    private audioDb: AudioDb = new AudioDb();
    private instrumentService: InstrumentService = new InstrumentService();

    public instruments: SvelteMap<InstrumentId, InstrumentWithId> = new SvelteMap()

    private instrumentSoloed = false

    // Populate instruments state from db, defaulting to default config
    // Also downloads default sound files
    async initialise(): Promise<Map<InstrumentId, InstrumentWithId>> {
        try {
            let instruments = await this.instrumentService.getAllInstruments()
            if (instruments.length == 0) {
                this.setupDefaultInstruments();
            } else {
                instruments.forEach((instrument) => this.saveInstrumentToStateAndDb(instrument))
            }
        } catch (e: any) {
            console.error("Error initialising instruments", e)
            this.setupDefaultInstruments();
        }
        return this.instruments
    }

    private setupDefaultInstruments() {
        defaultInstruments.forEach((instrument) => this.addInstrumentFromConfig(instrument));
        this.downloadDefaultAudioFiles();
    }

    async playHit(hit: InstrumentHit | undefined) {
        if (hit) {
            let instrument = this.instruments.get(hit.instrumentId)
            if (instrument?.muted) return 
            if (this.instrumentSoloed && !instrument?.soloed) return

            if (!this.audioManager.isHitInitialised(hit)) {
                console.log("Hit not init'd")
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

    async ensureInstrumentsInitialised() {
        const allHits = [...this.instruments.values()]
            .flatMap((hit) => [...hit.hitTypes.values()])
        return await this.audioManager.ensureAllAudioInitialised(allHits)
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

    onChangeVolume(id: InstrumentId, volume: number | undefined, delta: number | undefined) {
        this.updateInstrument(id, (instrument) => {
            if (instrument.volume != undefined && delta != undefined) {
                instrument.volume = clamp(instrument.volume += (delta / 100), 0, 1)
            } else if (volume != undefined) {
                instrument.volume = clamp(volume, 0, 1)
            } else { 
                instrument.volume = defaultVolume 
            }

            // modify volume for each hit type
            instrument.hitTypes.forEach((hit) => {
                this.audioManager.setVolume(hit.id, instrument.volume)
            })
        })
    }

    onToggleMute(id: InstrumentId) {
        this.updateInstrument(id, (instrument) => {
            instrument.muted = !instrument.muted
            if (instrument.muted) {
                instrument.soloed = false
            }
        })
    }

    onToggleSolo(id: InstrumentId) {
        this.updateInstrument(id, (instrument) => {
            // If we're about to solo this instrument
            if (!instrument.soloed) {
                // Unmute it
                instrument.muted = false
                // Unsolo all other instruments
                this.instruments.forEach((i) => {
                    i.soloed = false
                })
            }
            instrument.soloed = !instrument.soloed
            this.instrumentSoloed = instrument.soloed
        })
    }

    // Adds instruments from config, generating a new ID
    addInstrumentFromConfig(instrument: InstrumentConfig) {
        let instrumentId = `instrument_${crypto.randomUUID()}`
        let hitMap = new SvelteMap(instrument.hitTypes.map((hit) => {
            let hitWithId: HitTypeWithId = this.buildHitFromConfig(hit);
            return [hitWithId.id, hitWithId];
        }));
        let instruments = [...this.instruments.values()]
        let maxIndex = Math.max(0, ...[...instruments.map((i) => i.gridIndex)])
        let index = maxIndex + 1
        this.addInstrument(instrumentId, hitMap, instrument.name, index, defaultVolume);
    }

    // Saves a reactive instrument in state and db
    async addInstrument(
        instrumentId: string,
        hitMap: SvelteMap<string, HitTypeWithId>,
        name: string,
        index: number,
        volume: number,
    ) {
        let instrument: InstrumentWithId = {
            id: instrumentId,
            hitTypes: hitMap,
            gridIndex: index,
            name: name,
            volume: volume,
            muted: false,
            soloed: false,
        };
        await this.saveInstrumentToStateAndDb(instrument);
    }

    moveInstrument(event: InstrumentEvent, instrumentId: InstrumentId) {
        let movingInstrument = this.instruments.get(instrumentId)
        if (!movingInstrument) return
        let movingIndex = movingInstrument.gridIndex

        let swappingIndex
        if (event == InstrumentEvent.MoveDown) {
            swappingIndex = movingIndex + 1
        } else if (event == InstrumentEvent.MoveUp) {
            swappingIndex = movingIndex - 1
        } else {
            return
        }
        let swappingInstrument = [...this.instruments.values()].find((i) => i.gridIndex == swappingIndex)
        if (!swappingInstrument) return
        this.updateInstrument(movingInstrument.id, (i) => {
            i.gridIndex = swappingIndex
        })
        this.updateInstrument(swappingInstrument.id, (i) => {
            i.gridIndex = movingIndex
        })
    }

    private async saveInstrumentToStateAndDb(instrument: InstrumentWithId) {
        // Save a reactive version to state
        let reactiveInstrument = makeInstrumentReactive(instrument);
        this.instruments.set(instrument.id, reactiveInstrument);
        // Persist non reactive version in DB
        await this.instrumentService.saveInstrument(instrument)
    }

    // Adds a new hit to the instrument, generating a new id
    addHit(hit: HitType, instrumentId: InstrumentId) {
        let hitWithId = this.buildHitFromConfig(hit)
        let reactiveHit = $state(hitWithId)
        let instrument = this.instruments.get(instrumentId)
        if (instrument) {
            instrument.hitTypes.set(reactiveHit.id, reactiveHit)
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

    // Add missing fields to V1 and process
    async replaceInstrumentsV1(instruments: SavedInstrumentV1[]) {
        await  this.replaceInstrumentsV3(instruments.map((i) => { return { ...i, version: 3, gridIndex: 0 } }))
    }
    
    // Add missising fields to V3 and process
    async replaceInstrumentsV3(instruments: SavedInstrumentV3[]) {
        await this.replaceInstrumentsV4(instruments.map((i) => { return { ...i, version: 4, volume: defaultVolume } }))
    }

    // When loading from file, replace all instruments
    async replaceInstrumentsV4(instruments: SavedInstrumentV4[]) {
        await this.reset()
        for (const instrument of instruments) {
            let hitMap = new SvelteMap(instrument.hits.map((hit) => {
                let hitType: HitType = {
                    key: hit.key,
                    description: hit.description,
                    audioFileName: hit.audio_file_name,
                    volume: instrument.volume,
                }
                let hitWithId: HitTypeWithId = this.createHitWithId(hit.id, hitType);
                return [hitWithId.id, hitWithId];
            }));
            await this.addInstrument(instrument.id, hitMap, instrument.name, instrument.gridIndex, instrument.volume);
        }
    }

    async reset() {
        await this.instrumentService.deleteAllInstruments()
        this.instruments.clear()
        this.audioManager.reset()
    }

    private buildHitFromConfig(hit: HitType): HitTypeWithId {
        let hitId = `hit_${crypto.randomUUID()}`
        return this.createHitWithId(hitId, hit);
    }

    private createHitWithId(hitId: string, hit: HitType): HitTypeWithId {
        let hitWithId: HitTypeWithId = {
            id: hitId,
            key: hit.key,
            description: hit.description,
            audioFileName: hit.audioFileName,
            volume: hit.volume,
        };
        return hitWithId;
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

// Wraps an instrument and its hits in $state rune so it becomes reactive
function makeInstrumentReactive(instrument: InstrumentWithId): InstrumentWithId {
    instrument.hitTypes.forEach((hit) => {
        let reactiveHit = $state(hit);
        instrument.hitTypes.set(hit.id, reactiveHit);
    });
    let reactiveInstrument = $state(instrument);
    return reactiveInstrument;
}
