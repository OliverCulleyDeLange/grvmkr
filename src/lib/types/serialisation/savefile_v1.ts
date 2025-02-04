// Don't change anything in here once pushed to prod!

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
    hits: SavedInstrumentHitV1[]
}

export type SavedInstrumentHitV1 = {
    instrument_id: string
    hit_id: string
}