import type { InstrumentConfig } from "./types";

export const defaultInstruments: Array<InstrumentConfig> = [
    { 
        name: "Hi Hat", 
        hitTypes: [
            { key: "C", description: "Closed", audioPath: 'hat_closed.wav' },
            { key: "O", description: "Open", audioPath: 'hat_open.wav' },
        ], 
        gridIndex: 0
    },
    { 
        name: "Snare", 
        hitTypes: [
            { key: "X", description: "", audioPath: 'snare.wav' },
        ], 
        gridIndex: 1
    },
    { 
        name: "Kick", 
        hitTypes: [
            { key: "X", description: "", audioPath: 'kick.wav' },
        ], 
        gridIndex: 2
    },
];
