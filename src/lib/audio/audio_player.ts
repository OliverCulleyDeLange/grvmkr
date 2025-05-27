import { defaultVolume } from '$lib';
import { isNumber } from '$lib/util/types';

export class AudioPlayer {
	public url: string;
	private audioBuffer: AudioBuffer | null = null;
	private sourceNode: AudioBufferSourceNode | null = null;
	private gainNode: GainNode | null = null;
	private audioContext: AudioContext | null = null;

	constructor(url: string) {
		this.url = url;
	}

	// Fetches the audio url, which should be a local blob URL created from
	// the sound in the DB.
	// Decodes this into an audio buffer to multiple playbacks.
	// This shouldn't be done before a user interacts with the app as browsers
	// block un-requested audio.
	async loadAudio(audioContext: AudioContext): Promise<void> {
		this.audioContext = audioContext;
		try {
			const response = await fetch(this.url);
			const arrayBuffer = await response.arrayBuffer();
			this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
			this.gainNode = audioContext.createGain();
			this.gainNode.gain.value = defaultVolume;
		} catch (error) {
			console.error('Error loading audio:', error);
		}
	}

	isLoaded(): boolean {
		return this.audioBuffer != null && this.audioContext != null;
	}

	play(): void {
		if (this.audioBuffer && this.audioContext) {
			this.sourceNode = this.audioContext.createBufferSource();
			this.sourceNode.buffer = this.audioBuffer;
			if (this.gainNode) {
				this.sourceNode.connect(this.gainNode);
				this.gainNode.connect(this.audioContext.destination);
			} else {
				console.error(`No Gain control`);
				this.sourceNode.connect(this.audioContext.destination);
			}
			this.sourceNode.start();
		} else {
			console.error(`Audio not loaded yet for ${this.url}`);
		}
	}

	stop(): void {
		if (this.sourceNode) {
			this.sourceNode.stop();
		}
	}

	setVolume(volume: number): void {
		if (this.gainNode && isNumber(volume)) {
			this.gainNode.gain.setValueAtTime(volume, this.audioContext!.currentTime);
		}
	}
}
