import { defaultVolume } from '$lib';
import { isNumber } from '$lib/util/types';

export class AudioPlayer {
	public url: string;
	private audioBuffer: AudioBuffer | null = null;
	private activeSources = new Set<AudioBufferSourceNode>();
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
			if (!response.ok) throw new Error(`Failed to fetch audio: HTTP ${response.status}`);
			const arrayBuffer = await response.arrayBuffer();
			this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
			this.gainNode = audioContext.createGain();
			this.gainNode.gain.value = defaultVolume;
			this.gainNode.connect(audioContext.destination);
		} finally {
			if (this.url.startsWith('blob:')) URL.revokeObjectURL(this.url);
		}
	}

	isLoaded(): boolean {
		return this.audioBuffer != null && this.audioContext != null;
	}

	play(delayMs = 0): void {
		if (this.audioBuffer && this.audioContext) {
			const sourceNode = this.audioContext.createBufferSource();
			sourceNode.buffer = this.audioBuffer;
			if (this.gainNode) {
				sourceNode.connect(this.gainNode);
			} else {
				console.error(`No Gain control`);
				sourceNode.connect(this.audioContext.destination);
			}
			this.activeSources.add(sourceNode);
			sourceNode.onended = () => {
				sourceNode.disconnect();
				this.activeSources.delete(sourceNode);
			};
			sourceNode.start(this.audioContext.currentTime + Math.max(0, delayMs) / 1000);
		} else {
			console.error(`Audio not loaded yet for ${this.url}`);
		}
	}

	stop(): void {
		this.stopAll();
	}

	setVolume(volume: number): void {
		if (this.gainNode && isNumber(volume)) {
			this.gainNode.gain.setValueAtTime(volume, this.audioContext!.currentTime);
		}
	}

	dispose(): void {
		this.stopAll();
		this.gainNode?.disconnect();
	}

	stopAll(): void {
		for (const source of this.activeSources) {
			source.onended = null;
			try {
				source.stop();
			} catch {
				// A source may already have ended.
			}
			source.disconnect();
		}
		this.activeSources.clear();
	}
}
