export class AudioPlayer {

    public url: string;
    private audioBuffer: AudioBuffer | null = null;
    private sourceNode: AudioBufferSourceNode | null = null;
    private audioContext: AudioContext | null = null;

    constructor(url: string) {
        this.url = url
    }

    async loadAudio(audioContext: AudioContext): Promise<void> {
        this.audioContext = audioContext;
        try {
            const response = await fetch(this.url);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            // console.log(`Audio loaded successfully for ${this.url}`);
        } catch (error) {
            console.error("Error loading audio:", error);
        }
    }

    isLoaded(): boolean {
        return this.audioBuffer != null && this.audioContext != null
    }

    play(): void {
        if (this.audioBuffer && this.audioContext) {
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.connect(this.audioContext.destination);
            this.sourceNode.start();
        } else {
            console.error(`Audio not loaded yet for ${this.url}`);
        }
    }

    stop(): void {
        if (this.sourceNode) {
            this.sourceNode.stop();
            // console.log("Audio stopped.");
        }
    }
}