import type { InstrumentConfig } from "$lib";

export const defaultInstruments: Array<InstrumentConfig> = [
    { 
        name: "Hi Hat", 
        hitTypes: [
            { key: "C", description: "Closed", audioFileName: 'hat_closed.wav' },
            { key: "O", description: "Open", audioFileName: 'hat_open.wav' },
        ], 
        gridIndex: 0
    },
    { 
        name: "Snare", 
        hitTypes: [
            { key: "X", description: "", audioFileName: 'snare.wav' },
        ], 
        gridIndex: 1
    },
    { 
        name: "Kick", 
        hitTypes: [
            { key: "X", description: "", audioFileName: 'kick.wav' },
        ], 
        gridIndex: 2
    },
];
