import type { HitId, HitTypeWithId, InstrumentHit, InstrumentWithId, OnEvent } from '$lib';
import { AudioDb, AudioPlayer, ProblemEvent } from '$lib';

// Maintains a collection of playable 'hits',
// which are samples that an instrument can play
export class AudioManager {
	private onEvent: OnEvent;

	private audioContext: AudioContext | null = null;
	private audioDb = new AudioDb();

	private hits: Map<HitId, AudioPlayer> = new Map();
	private initialisationFailed: HitId[] = [];

	constructor(onEvent: OnEvent) {
		this.onEvent = onEvent;
	}

	isHitInitialised(hit: InstrumentHit): boolean {
		let player = this.hits.get(hit.hitId);
		return player != undefined && player.isLoaded();
	}

	async ensureAllAudioInitialised(hits: HitTypeWithId[]) {
		this.ensureAudioContext();
		for (let hit of hits) {
			let audioPlayer = this.hits.get(hit.id);
			if (!audioPlayer) {
				await this.initialiseHit(hit);
			} else {
				if (!audioPlayer.isLoaded()) {
					await audioPlayer.loadAudio(this.audioContext!);
				}
			}
		}
	}

	// Loads the sample from the DB and initialises an Audio Player with the blob URL
	async initialiseHit(hit: HitTypeWithId) {
		this.ensureAudioContext();
		if (this.initialisationFailed.includes(hit.id)) return;
		try {
			let audioFileName = hit.audioFileName;
			// Loading audio can fail if the sample isn't found
			let fileUrl = await this.audioDb.loadAudioFileUrl(audioFileName);
			let player = new AudioPlayer(fileUrl);
			await player.loadAudio(this.audioContext!);
			player.setVolume(hit.volume);
			this.hits.set(hit.id, player);
		} catch (e: any) {
			if (e == 'loadAudio: onsuccess but no result') {
				this.onEvent({
					event: ProblemEvent.MissingSampleAudio,
					hit: hit
				});
				hit.audioFileName = '';
				this.initialisationFailed.push(hit.id);
			}
		}
	}

	playHit(hit: InstrumentHit) {
		if (hit.hitId == undefined) return;
		let player = this.hits.get(hit.hitId);
		if (player) {
			player.play();
		} else {
			console.error(`Can't play ${hit.hitId}, as no player. ExistingPlayers: `, this.hits);
		}
	}

	removeHit(hitId: HitId) {
		this.hits.delete(hitId);
	}

	setVolume(hitId: HitId, volume: number) {
		let player = this.hits.get(hitId);
		if (player) {
			player.setVolume(volume);
		} else {
			console.error(`Can't set volume for ${hitId}, as no player. ExistingPlayers: `, this.hits);
		}
	}

	reset() {
		this.hits.clear();
	}

	private ensureAudioContext() {
		if (!this.audioContext) {
			this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
		}
	}
}
