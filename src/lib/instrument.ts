export class InstrumentConfig {
    public audioPath: string
    public gridIndex: number

    constructor(audioPath: string, gridIndex: number){
        this.audioPath = audioPath
        this.gridIndex = gridIndex
    }
}

export class Instrument {

    public config: InstrumentConfig;
    private audioBuffer: AudioBuffer | null = null;
    private sourceNode: AudioBufferSourceNode | null = null;
    private audioContext: AudioContext | null = null;

    constructor(config: InstrumentConfig) {
        this.config = config
    }
    
    async loadAudio(audioContext: AudioContext): Promise<void> {
        this.audioContext = audioContext;
        try {
            const response = await fetch(`./${this.config.audioPath}`);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            console.log(`Audio loaded successfully for ${this.config.audioPath}`);
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
            console.error(`Audio not loaded yet for ${this.config.audioPath}`);
        }
    }

    stop(): void {
        if (this.sourceNode) {
            this.sourceNode.stop();
            console.log("Audio stopped.");
        }
    }
}