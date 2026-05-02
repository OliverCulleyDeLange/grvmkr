import type { HitId, HitTypeWithId, InstrumentHit, OnEvent } from '$lib';
import { AudioDb, AudioPlayer, defaultVolume, ProblemEvent } from '$lib';

// Maintains a collection of playable 'hits',
// which are samples that an instrument can play
export class AudioManager {
	private onEvent: OnEvent;

	private audioContext: AudioContext | null = null;
	private audioDb = new AudioDb();

	private hits: Map<HitId, AudioPlayer> = new Map();
	// Volume requests received before a player is initialised — applied when the player loads.
	private pendingVolumes: Map<HitId, number> = new Map();

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
	async initialiseHit(hit: HitTypeWithId, volume: number = defaultVolume) {
		this.ensureAudioContext();
		try {
			let audioFileName = hit.audioFileName;
			// Loading audio can fail if the sample isn't found
			let fileUrl = await this.audioDb.loadAudioFileUrl(audioFileName);
			let player = new AudioPlayer(fileUrl);
			await player.loadAudio(this.audioContext!);
			const pending = this.pendingVolumes.get(hit.id);
			player.setVolume(pending ?? volume);
			this.pendingVolumes.delete(hit.id);
			this.hits.set(hit.id, player);
		} catch (e: any) {
			if (e == 'loadAudio: onsuccess but no result') {
				this.onEvent({
					event: ProblemEvent.MissingSampleAudio,
					hit: hit
				});
				hit.audioFileName = '';
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
		this.pendingVolumes.delete(hitId);
	}

	setVolume(hit: HitTypeWithId, volume: number) {
		let player = this.hits.get(hit.id);
		if (player) {
			player.setVolume(volume);
		} else {
			// Player not loaded yet — remember the volume so initialiseHit applies it later.
			this.pendingVolumes.set(hit.id, volume);
		}
	}

	reset() {
		this.hits.clear();
		this.pendingVolumes.clear();
	}

	private ensureAudioContext() {
		if (!this.audioContext) {
			const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
			this.audioContext = new AudioCtx();
		}
	}
}
