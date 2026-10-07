import {
	AudioDb,
	AudioManager,
	defaultInstrumentConfig,
	defaultInstruments,
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
		return this.instruments;
	}

	getInstrument(id: InstrumentId): InstrumentWithId | null {
		return this.instruments.get(id) ?? null;
	}

	async addDefaultInstrument(): Promise<void> {
		await this.addInstrumentFromConfig(defaultInstrumentConfig);
	}

	// Populate instruments state from the working files instruments, defaulting to default config
	// Also downloads default sound files
	async initialise(
		instrumentMap: Map<InstrumentId, InstrumentWithId>
	): Promise<Map<InstrumentId, InstrumentWithId>> {
		try {
			const instruments = Array.from(instrumentMap.values());
			if (instruments.length == 0) {
				console.log('No instruments found, setting up default instruments');
				await this.setupDefaultInstruments();
			} else {
				for (const instrument of instruments) {
					await this.saveInstrumentToStateAndDb(instrument, false);
				}
			}
		} catch (e: unknown) {
			console.error('Error initialising instruments', e);
			await this.setupDefaultInstruments();
		}
		return this.instruments;
	}

	private async setupDefaultInstruments() {
		for (const instrument of defaultInstruments) {
			await this.addInstrumentFromConfig(instrument);
		}
		void this.downloadDefaultAudioFiles();
	}

	async playHit(hit: InstrumentHit | undefined, delayMs = 0) {
		if (hit) {
			const instrument = this.instruments.get(hit.instrumentId);
			if (instrument?.muted) return;
			if (this.instrumentSoloed && !instrument?.soloed) return;

			if (!this.audioManager.isHitInitialised(hit)) {
				console.log("Hit not init'd", $state.snapshot(hit));
				const hitType = instrument?.hitTypes.get(hit.hitId);
				if (hitType) {
					try {
						await this.audioManager.initialiseHit(hitType);
						this.audioManager.playHit(hit, delayMs);
					} catch (e) {
						console.error('Unhandled error when loading uninitialised instrument hit:', e);
					}
				} else {
					console.error(
						`Can't play hit as audio not initialised and instrument with id ${hit.instrumentId} with hit with id ${hit.hitId} doesn't exist in instrument manager`
					);
				}
			} else {
				this.audioManager.playHit(hit, delayMs);
			}
		}
	}

	async play(instrumentId: InstrumentId, hitId: HitId) {
		await this.playHit({ instrumentId, hitId });
	}

	stopScheduledAudio() {
		this.audioManager.stopAll();
	}

	async ensureInstrumentsInitialised() {
		const allHits = [...this.instruments.values()].flatMap((hit) => [...hit.hitTypes.values()]);
		return await this.audioManager.ensureAllAudioInitialised(allHits);
	}

	onChangeName(name: string, id: InstrumentId): void {
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
		const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
		const uniqueFilename = `${hitId}--grvmkr--${crypto.randomUUID()}--grvmkr--${safeName}`;
		const storedFilename = await this.audioDb.storeAudio(file, uniqueFilename);
		this.updateInstrumentHit(instrumentId, hitId, (hit) => {
			hit.audioFileName = storedFilename;
		});
		this.audioManager.removeHit(hitId);
	}

	// Pushes the file-level volume into the audio manager for every hit on this instrument.
	applyInstrumentVolumeToAudio(id: InstrumentId, volume: number) {
		const instrument = this.instruments.get(id);
		if (!instrument) return;
		instrument.hitTypes.forEach((hit) => {
			this.audioManager.setVolume(hit, volume);
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
		const instrumentId = `instrument_${crypto.randomUUID()}`;
		const hitMap = new SvelteMap(
			instrument.hitTypes.map((hit) => {
				const hitWithId: HitTypeWithId = this.buildHitFromConfig(hit);
				return [hitWithId.id, hitWithId];
			})
		);
		const instruments = [...this.instruments.values()];
		const maxIndex = Math.max(0, ...[...instruments.map((i) => i.gridIndex)]);
		const index = maxIndex + 1;
		await this.addInstrument(instrumentId, hitMap, instrument.name, index);
	}

	// Saves a reactive instrument in state and db
	async addInstrument(
		instrumentId: string,
		hitMap: SvelteMap<string, HitTypeWithId>,
		name: string,
		index: number
	) {
		const instrument: InstrumentWithId = {
			id: instrumentId,
			hitTypes: hitMap,
			gridIndex: index,
			name: name,
			muted: false,
			soloed: false
		};
		await this.saveInstrumentToStateAndDb(instrument);
	}

	async moveInstrument(direction: 'up' | 'down', instrumentId: InstrumentId) {
		const movingInstrument = this.instruments.get(instrumentId);
		if (!movingInstrument) return;

		// Get all instruments sorted by gridIndex
		const sortedInstruments = [...this.instruments.values()].sort(
			(a, b) => a.gridIndex - b.gridIndex
		);
		const currentIndex = sortedInstruments.findIndex((i) => i.id === instrumentId);
		if (currentIndex === -1) return;

		let swapIndex;
		if (direction === 'down' && currentIndex < sortedInstruments.length - 1) {
			swapIndex = currentIndex + 1;
		} else if (direction === 'up' && currentIndex > 0) {
			swapIndex = currentIndex - 1;
		} else {
			return; // Can't move further in that direction
		}

		// Swap the gridIndex values of the two instruments
		const movingGridIndex = sortedInstruments[currentIndex].gridIndex;
		const swappingGridIndex = sortedInstruments[swapIndex].gridIndex;

		await this.updateInstrument(sortedInstruments[currentIndex].id, (i) => {
			i.gridIndex = swappingGridIndex;
		});
		await this.updateInstrument(sortedInstruments[swapIndex].id, (i) => {
			i.gridIndex = movingGridIndex;
		});

		// Reindex remaining instruments to ensure continuous indexes
		await this.reindexInstruments();
	}

	private async saveInstrumentToStateAndDb(instrument: InstrumentWithId, persist: boolean = true) {
		// Save a reactive version to state
		const reactiveInstrument = makeInstrumentReactive(instrument);
		this.instruments.set(instrument.id, reactiveInstrument);
		// Persist non reactive version in DB
		if (persist) await this.instrumentRepository.saveInstrument(instrument);
	}

	// Adds a new hit to the instrument, generating a new id
	async addHit(hit: HitType, instrumentId: InstrumentId) {
		const hitWithId = this.buildHitFromConfig(hit);
		const reactiveHit = $state(hitWithId);
		const instrument = this.instruments.get(instrumentId);
		if (instrument) {
			instrument.hitTypes.set(reactiveHit.id, reactiveHit);
			console.log('Saving hit for instrument', instrument);
			await this.instrumentRepository.saveInstrument(instrument);
		}
	}

	async removeInstrument(id: InstrumentId) {
		this.instruments.delete(id);
		await this.instrumentRepository.deleteInstrument(id);

		// Reindex remaining instruments to ensure continuous indexes
		await this.reindexInstruments();
	}

	private async reindexInstruments() {
		const sortedInstruments = [...this.instruments.values()].sort(
			(a, b) => a.gridIndex - b.gridIndex
		);
		for (let i = 0; i < sortedInstruments.length; i++) {
			if (sortedInstruments[i].gridIndex !== i) {
				await this.updateInstrument(sortedInstruments[i].id, (instrument) => {
					instrument.gridIndex = i;
				});
			}
		}
	}

	async removeHit(instrumentId: InstrumentId, hitId: HitId) {
		const updatedInstrument = await this.updateInstrument(instrumentId, (instrument) => {
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
			const hitMap = new SvelteMap(
				instrument.hits.map((hit) => {
					const hitType: HitType = {
						key: hit.key,
						description: hit.description,
						audioFileName: hit.audio_file_name
					};
					const hitWithId: HitTypeWithId = mapHitTypeToHitTypeWithId(hit.id, hitType);
					return [hitWithId.id, hitWithId];
				})
			);
			await this.addInstrument(instrument.id, hitMap, instrument.name, instrument.gridIndex);
		}
	}

	async replaceInstruments(instruments: InstrumentWithId[]) {
		this.instruments.clear();
		for (const instrument of instruments) {
			await this.saveInstrumentToStateAndDb(instrument, true);
		}
	}

	async reset() {
		await this.instrumentRepository.deleteAllInstruments();
		await this.audioDb.deleteAllAudio();
		this.instruments.clear();
		this.audioManager.reset();
	}

	private buildHitFromConfig(hit: HitType): HitTypeWithId {
		const hitId = `hit_${crypto.randomUUID()}`;
		return mapHitTypeToHitTypeWithId(hitId, hit);
	}

	private async updateInstrument(
		id: InstrumentId,
		callback: (config: InstrumentWithId) => void
	): Promise<InstrumentWithId | undefined> {
		const instrument = this.instruments.get(id);
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
			const hit = instrument.hitTypes.get(hitId);
			if (hit) {
				callback(hit);
			} else {
				console.error(`Couldn't update instrument hit ${hitId} as it doesn't exist`);
			}
		});
	}

	// Downloads default audio files if they don't exist in the db already
	private async downloadDefaultAudioFiles() {
		await Promise.all(
			Array.from(this.instruments.values()).flatMap((instrument) =>
				Array.from(instrument.hitTypes.values()).map(async (hit) => {
					try {
						const exists = await this.audioDb.audioExists(hit.audioFileName);
						if (!exists) {
							const res = await fetch(`./mp3/${hit.audioFileName}`);
							if (!res.ok) throw new Error(`HTTP ${res.status}`);
							const blob = await res.blob();
							const file = new File([blob], hit.audioFileName, { type: blob.type });
							await this.audioDb.storeAudio(file, file.name);
						}
					} catch (error) {
						console.error(`Failed to download/store ${hit.audioFileName}:`, error);
					}
				})
			)
		);
	}
}

// Wraps an instrument and its hits in $state rune so it becomes reactive
function makeInstrumentReactive(instrument: InstrumentWithId): InstrumentWithId {
	instrument.hitTypes.forEach((hit) => {
		const reactiveHit = $state(hit);
		instrument.hitTypes.set(hit.id, reactiveHit);
	});
	const reactiveInstrument = $state(instrument);
	return reactiveInstrument;
}
