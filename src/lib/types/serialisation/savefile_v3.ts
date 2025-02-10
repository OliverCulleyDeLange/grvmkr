import type { SavedGridConfigV2, SavedGridRowV1, SavedInstrumentHitV1, SavedInstrumentV1, SaveFile } from "$lib"

// Don't change anything in here.
// If things change, create a V4 and confirm backwards compatibility with V3&V2&V1 files. 
// Changes since V2:
// - SavedGridV3.rows -> SavedGridRowV2 which contains nested Bars->Beats->Divisions structure same as domain state, to support merged cells

export type SaveFileV3 = SaveFile & {
    type: 'savefile'
    version: 3

    name: string
    instruments: SavedInstrumentV1[]
    grids: SavedGridV3[]
}

export type SavedGridV3 = {
    type: 'grid'
    version: 3

    id: string
    config: SavedGridConfigV2
    rows: SavedGridRowV3[]
}

export type SavedGridRowV3 = {
    instrument_id: string
    notation: SavedNotationV3
}

export type SavedNotationV3 = {
    bars: SavedBarV3[]
}

export type SavedBarV3 = {
    beats: SavedBeatV3[]
};

export type SavedBeatV3 = {
    divisions: SavedBeatDivisionV3[]
};

export type SavedBeatDivisionV3 = {
    gridIndex: number
    cellsOccupied: number
    hits: SavedInstrumentHitV1[]
};
