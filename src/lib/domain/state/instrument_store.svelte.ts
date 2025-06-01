import {
	AudioDb,
	AudioManager,
	defaultInstrumentConfig,
	defaultInstruments,
	defaultVolume,
	InstrumentEvent,
	InstrumentRepository,
	mapHitTypeToHitTypeWithId,
	type HitId,
	type HitType,
	type HitTypeWithId,
	type InstrumentConfig,
	type InstrumentHit,
	type InstrumentId,
	type InstrumentRepositoryI,
	type InstrumentWithId,
	type SavedInstrumentV4
} from '$lib';
import type { OnEvent } from '$lib/domain/event';
import { clamp } from '$lib/util/math';
import { SvelteMap } from 'svelte/reactivity';

// Responsible for storing, modifying and playing instruments
export class InstrumentStore implements InstrumentRepositoryI {
	private audioManager: AudioManager;
	private audioDb: AudioDb = new AudioDb();
	private instrumentRepository: InstrumentRepository = new InstrumentRepository();

	private instruments: SvelteMap<InstrumentId, InstrumentWithId> = new SvelteMap();

	private instrumentSoloed = false;

	constructor(onEvent: OnEvent) {
		this.audioManager = new AudioManager(onEvent);
	}

	// TODO Should i state.snapshot, or is it ok to return a mutable domain object?
	// Feels like it should return a snapshot so others can't modify instrument state
	getInstruments(): Map<InstrumentId, InstrumentWithId> {
		return this.instruments
	}
	
	getInstrument(id: InstrumentId): InstrumentWithId | null {
		return this.instruments.get(id) ?? null
	}

	async addDefaultInstrument(): Promise<void> {
		await this.addInstrumentFromConfig(defaultInstrumentConfig)
	}

	// Populate instruments state from the working files instruments, defaulting to default config
	// Also downloads default sound files
	async initialise(
		instrumentMap: Map<InstrumentId, InstrumentWithId>
	): Promise<Map<InstrumentId, InstrumentWithId>> {
		try {
			let instruments = Array.from(instrumentMap.values());
			if (instruments.length == 0) {
				console.log('No instruments found, setting up default instruments');
				await this.setupDefaultInstruments();
			} else {
				for (const instrument of instruments) {
					await this.saveInstrumentToStateAndDb(instrument, false);
				}
			}
		} catch (e: any) {
			console.error('Error initialising instruments', e);
			await this.setupDefaultInstruments();
		}
		return this.instruments;
	}

	private async setupDefaultInstruments() {
		for (const instrument of defaultInstruments) {
			await this.addInstrumentFromConfig(instrument);
		}
		this.downloadDefaultAudioFiles(); // No await so it happens in the background 
	}

	async playHit(hit: InstrumentHit | undefined) {
		if (hit) {
			let instrument = this.instruments.get(hit.instrumentId);
			if (instrument?.muted) return;
			if (this.instrumentSoloed && !instrument?.soloed) return;

			if (!this.audioManager.isHitInitialised(hit)) {
				console.log("Hit not init'd", $state.snapshot(hit));
				let hitType = instrument?.hitTypes.get(hit.hitId);
				if (hitType) {
					try {
						await this.audioManager.initialiseHit(hitType);
						this.audioManager.playHit(hit);
					} catch (e) {
						console.error('Unhandled error when loading uninitialised instrument hit:', e);
					}
				} else {
					console.error(
						`Can't play hit as audio not initialised and instrument with id ${hit.instrumentId} with hit with id ${hit.hitId} doesn't exist in instrument manager`
					);
				}
			} else {
				this.audioManager.playHit(hit);
			}
		}
	}

	async play(instrumentId: InstrumentId, hitId: HitId) {
		await this.playHit({ instrumentId, hitId });
	}

	async ensureInstrumentsInitialised() {
		const allHits = [...this.instruments.values()].flatMap((hit) => [...hit.hitTypes.values()]);
		return await this.audioManager.ensureAllAudioInitialised(allHits);
	}

	onChangeName(name: string, id: InstrumentId): any {
		this.updateInstrument(id, (instrument) => {
			instrument.name = name;
		});
	}

	onChangeHitKey(value: string, instrumentId: InstrumentId, hitId: HitId) {
		this.updateInstrumentHit(instrumentId, hitId, (hit) => {
			hit.key = value;
		});
	}

	onChangeHitDescription(value: string, instrumentId: InstrumentId, hitId: HitId) {
		this.updateInstrumentHit(instrumentId, hitId, (hit) => {
			hit.description = value;
		});
	}

	async onChangeSample(file: File, instrumentId: InstrumentId, hitId: HitId) {
		let storedFilename = await this.audioDb.storeAudio(file, file.name);
		this.updateInstrumentHit(instrumentId, hitId, (hit) => {
			hit.audioFileName = storedFilename;
		});
		this.audioManager.removeHit(hitId);
	}

	onChangeVolume(id: InstrumentId, volume: number | undefined, delta: number | undefined) {
		this.updateInstrument(id, (instrument) => {
			if (instrument.volume != undefined && delta != undefined) {
				instrument.volume = clamp((instrument.volume += delta / 100), 0, 1);
			} else if (volume != undefined) {
				instrument.volume = clamp(volume, 0, 1);
			} else {
				instrument.volume = defaultVolume;
			}

			// modify volume for each hit type
			instrument.hitTypes.forEach((hit) => {
				this.audioManager.setVolume(hit.id, instrument.volume);
			});
		});
	}

	onToggleMute(id: InstrumentId) {
		this.updateInstrument(id, (instrument) => {
			instrument.muted = !instrument.muted;
			if (instrument.muted) {
				instrument.soloed = false;
			}
		});
	}

	onToggleSolo(id: InstrumentId) {
		this.updateInstrument(id, (instrument) => {
			// If we're about to solo this instrument
			if (!instrument.soloed) {
				// Unmute it
				instrument.muted = false;
				// Unsolo all other instruments
				this.instruments.forEach((i) => {
					i.soloed = false;
				});
			}
			instrument.soloed = !instrument.soloed;
			this.instrumentSoloed = instrument.soloed;
		});
	}

	// Adds instruments from config, generating a new ID
	async addInstrumentFromConfig(instrument: InstrumentConfig) {
		let instrumentId = `instrument_${crypto.randomUUID()}`;
		let hitMap = new SvelteMap(
			instrument.hitTypes.map((hit) => {
				let hitWithId: HitTypeWithId = this.buildHitFromConfig(hit);
				return [hitWithId.id, hitWithId];
			})
		);
		let instruments = [...this.instruments.values()];
		let maxIndex = Math.max(0, ...[...instruments.map((i) => i.gridIndex)]);
		let index = maxIndex + 1;
		await this.addInstrument(instrumentId, hitMap, instrument.name, index, defaultVolume);
	}

	// Saves a reactive instrument in state and db
	async addInstrument(
		instrumentId: string,
		hitMap: SvelteMap<string, HitTypeWithId>,
		name: string,
		index: number,
		volume: number
	) {
		let instrument: InstrumentWithId = {
			id: instrumentId,
			hitTypes: hitMap,
			gridIndex: index,
			name: name,
			volume: volume,
			muted: false,
			soloed: false
		};
		await this.saveInstrumentToStateAndDb(instrument);
	}

	async moveInstrument(direction: "up" | "down", instrumentId: InstrumentId) {
		let movingInstrument = this.instruments.get(instrumentId);
		if (!movingInstrument) return;
		let movingIndex = movingInstrument.gridIndex;

		let swappingIndex;
		if (direction == "down") {
			swappingIndex = movingIndex + 1;
		} else if (direction == "up") {
			swappingIndex = movingIndex - 1;
		} else {
			return;
		}
		let swappingInstrument = [...this.instruments.values()].find(
			(i) => i.gridIndex == swappingIndex
		);
		if (!swappingInstrument) return;
		await this.updateInstrument(movingInstrument.id, (i) => {
			i.gridIndex = swappingIndex;
		});
		await this.updateInstrument(swappingInstrument.id, (i) => {
			i.gridIndex = movingIndex;
		});
	}

	private async saveInstrumentToStateAndDb(instrument: InstrumentWithId, persist: boolean = true) {
		// Save a reactive version to state
		let reactiveInstrument = makeInstrumentReactive(instrument);
		this.instruments.set(instrument.id, reactiveInstrument);
		// Persist non reactive version in DB
		if (persist) await this.instrumentRepository.saveInstrument(instrument);
	}

	// Adds a new hit to the instrument, generating a new id
	async addHit(hit: HitType, instrumentId: InstrumentId) {
		let hitWithId = this.buildHitFromConfig(hit);
		let reactiveHit = $state(hitWithId);
		let instrument = this.instruments.get(instrumentId);
		if (instrument) {
			instrument.hitTypes.set(reactiveHit.id, reactiveHit);
			console.log("Saving hit for instrument", instrument)
			await this.instrumentRepository.saveInstrument(instrument);
		}
	}

	async removeInstrument(id: InstrumentId) {
		this.instruments.delete(id);
		await this.instrumentRepository.deleteInstrument(id);
	}

	async removeHit(instrumentId: InstrumentId, hitId: HitId) {
		let updatedInstrument = await this.updateInstrument(instrumentId, (instrument) => {
			instrument.hitTypes.delete(hitId);
		});
		this.audioManager.removeHit(hitId);
		if (updatedInstrument) {
			await this.instrumentRepository.saveInstrument(updatedInstrument);
		}
	}

	// When loading from file, replace all instruments
	async replaceInstrumentsV4(instruments: SavedInstrumentV4[]) {
		this.instruments.clear();
		for (const instrument of instruments) {
			let hitMap = new SvelteMap(
				instrument.hits.map((hit) => {
					let hitType: HitType = {
						key: hit.key,
						description: hit.description,
						audioFileName: hit.audio_file_name,
						volume: instrument.volume
					};
					let hitWithId: HitTypeWithId = mapHitTypeToHitTypeWithId(hit.id, hitType);
					return [hitWithId.id, hitWithId];
				})
			);
			await this.addInstrument(
				instrument.id,
				hitMap,
				instrument.name,
				instrument.gridIndex,
				instrument.volume
			);
		}
	}

	async replaceInstruments(instruments: InstrumentWithId[]) {
		this.instruments.clear();
		for (const instrument of instruments) {
			await this.saveInstrumentToStateAndDb(instrument, true)
		}
	}

	async reset() {
		await this.instrumentRepository.deleteAllInstruments();
		await this.audioDb.deleteAllAudio()
		this.instruments.clear();
		this.audioManager.reset();
	}

	private buildHitFromConfig(hit: HitType): HitTypeWithId {
		let hitId = `hit_${crypto.randomUUID()}`;
		return mapHitTypeToHitTypeWithId(hitId, hit);
	}

	private async updateInstrument(
		id: InstrumentId,
		callback: (config: InstrumentWithId) => void
	): Promise<InstrumentWithId | undefined> {
		let instrument = this.instruments.get(id);
		if (instrument) {
			callback(instrument);
			await this.instrumentRepository.saveInstrument(instrument);
		} else {
			console.error(`Couldn't update instrument ${id} as it doesn't exist`);
		}
		return instrument;
	}

	private updateInstrumentHit(
		instrumentId: InstrumentId,
		hitId: HitId,
		callback: (config: HitType) => void
	) {
		this.updateInstrument(instrumentId, (instrument) => {
			let hit = instrument.hitTypes.get(hitId);
			if (hit) {
				callback(hit);
			} else {
				console.error(`Couldn't update instrument hit ${hitId} as it doesn't exist`);
			}
		});
	}

	// Downloads default audio files if they don't exist in the db already
	private async downloadDefaultAudioFiles() {
		for (const [id, instrument] of this.instruments) {
			for (const [id, hit] of instrument.hitTypes) {
				const exists = await this.audioDb.audioExists(hit.audioFileName);
				if (!exists) {
					console.log('Downloading default audio file', hit.audioFileName);
					try {
						const res = await fetch(`./mp3/${hit.audioFileName}`);
						const blob = await res.blob();
						const file = new File([blob], hit.audioFileName, { type: blob.type });
						await this.audioDb.storeAudio(file, file.name);
					} catch (error) {
						console.error(`Failed to download/store ${hit.audioFileName}:`, error);
					}
				}
			}
		}
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
