export class AudioPlayer {

    public path: string;
    private audioBuffer: AudioBuffer | null = null;
    private sourceNode: AudioBufferSourceNode | null = null;
    private audioContext: AudioContext | null = null;

    constructor(path: string) {
        this.path = path
    }

    async loadAudio(audioContext: AudioContext): Promise<void> {
        this.audioContext = audioContext;
        try {
            const response = await fetch(`./${this.path}`);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            console.log(`Audio loaded successfully for ${this.path}`);
        } catch (error) {
            console.error("Error loading audio:", error);
        }
    }

    isLoaded(): Boolean {
        return this.audioBuffer != null && this.audioContext != null
    }

    play(): void {
        if (this.audioBuffer && this.audioContext) {
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.connect(this.audioContext.destination);
            this.sourceNode.start();
        } else {
            console.error(`Audio not loaded yet for ${this.path}`);
        }
    }

    stop(): void {
        if (this.sourceNode) {
            this.sourceNode.stop();
            console.log("Audio stopped.");
        }
    }
}