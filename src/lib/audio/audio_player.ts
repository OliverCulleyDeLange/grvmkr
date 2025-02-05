export class AudioPlayer {

    public url: string;
    private audioBuffer: AudioBuffer | null = null;
    private sourceNode: AudioBufferSourceNode | null = null;
    private audioContext: AudioContext | null = null;

    constructor(url: string) {
        this.url = url
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
        }
    }
}