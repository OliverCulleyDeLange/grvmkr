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
    { 
        name: "Surdo L", 
        hitTypes: [
            { key: "X", description: "", audioFileName: 'surdo_l.wav' },
        ], 
    },
    { 
        name: "Surdo M", 
        hitTypes: [
            { key: "X", description: "", audioFileName: 'surdo_m.wav' },
        ], 
    },
    { 
        name: "Surdo H", 
        hitTypes: [
            { key: "X", description: "", audioFileName: 'surdo_h.wav' },
        ], 
    },
    { 
        name: "Repinique", 
        hitTypes: [
            { key: "X", description: "Hit", audioFileName: 'repinique_hit.wav' },
            { key: "r", description: "Rim", audioFileName: 'repinique_rim.wav' },
            { key: "H", description: "Hand", audioFileName: 'repinique_hand.wav' },
        ], 
    },
    { 
        name: "Caixa", 
        hitTypes: [
            { key: "X", description: "Accent", audioFileName: 'caixa.wav' },
            { key: "x", description: "Ghost", audioFileName: 'caixa_ghost.wav' },
        ], 
    },
    { 
        name: "Tamborim", 
        hitTypes: [
            { key: "X", description: "", audioFileName: 'tamborim.wav' },
        ], 
    },
    { 
        name: "Timba", 
        hitTypes: [
            { key: "S", description: "Slap", audioFileName: 'timba_slap.wav' },
            { key: "O", description: "Open", audioFileName: 'timba_open.wav' },
        ], 
    },
    { 
        name: "Shaker", 
        hitTypes: [
            { key: "X", description: "", audioFileName: 'shaker_a.wav' },
            { key: "x", description: "", audioFileName: 'shaker_g.wav' },
        ], 
    },
];
