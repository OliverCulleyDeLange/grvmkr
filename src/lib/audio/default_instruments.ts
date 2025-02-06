import type { InstrumentConfig } from "$lib";

export const defaultHitConfig = { 
    key: "X", description: "", audioFileName: ""
}

export const defaultInstrumentConfig: InstrumentConfig = { 
    name: "Instrument", 
    hitTypes: [
        defaultHitConfig
    ], 
}

export const defaultInstruments: Array<InstrumentConfig> = [
    { 
        name: "Hi Hat", 
        hitTypes: [
            { key: "C", description: "Closed", audioFileName: 'hat_closed.wav' },
            { key: "O", description: "Open", audioFileName: 'hat_open.wav' },
        ], 
    },
    { 
        name: "Snare", 
        hitTypes: [
            { key: "X", description: "", audioFileName: 'snare.wav' },
        ], 
    },
    { 
        name: "Kick", 
        hitTypes: [
            { key: "X", description: "", audioFileName: 'kick.wav' },
        ], 
    },
];
