// Don't change anything in here.
// If things change, create a V2 and confirm backwards compatibility with V1 files. 

export type SaveFileV1 = {
    type: 'savefile'
    version: 1

    instruments: SavedInstrumentV1[]
    grids: SavedGridV1[]
}

export type SavedInstrumentV1 = {
    type: 'instrument'
    version: 1

    id: string
    name: string
    hits: SavedHitV1[]
}

export type SavedHitV1 = {
    type: 'hit'
    version: 1

    id: string
    key: string
    description: string
    audio_file_name: string
}

export type SavedGridV1 = {
    type: 'grid'
    version: 1

    id: string
    config: SavedGridConfigV1
    rows: SavedGridRowV1[]
}

export type SavedGridConfigV1 = {
    bpm: number
    bars: number
    beats_per_bar: number
    beat_divisions: number
}

export type SavedGridRowV1 = {
    instrument_id: string
    hits: SavedInstrumentHitV1[]
}

export type SavedInstrumentHitV1 = {
    instrument_id: string
    hit_id: string
}