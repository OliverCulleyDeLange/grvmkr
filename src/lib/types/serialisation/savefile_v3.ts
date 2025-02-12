import type { SavedGridConfigV2, SavedHitV1, SavedInstrumentHitV1, SavedInstrumentV1, SaveFile } from "$lib"

// Don't change anything in here.
// If things change, create a V4 and confirm backwards compatibility with V3&V2&V1 files. 
// Changes since V2:
// - Grid allows saving cells_occupied for merged cells
// - SavedInstrumentV3 adds gridIndex to persist ordering

export type SaveFileV3 = SaveFile & {
    type: 'savefile'
    version: 3

    name: string
    instruments: SavedInstrumentV3[]
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
    cells: SavedGridCellV3[]
}

export type SavedGridCellV3 = {
    cells_occupied: number
    hits: SavedInstrumentHitV1[]
};

export type SavedInstrumentV3 = {
    type: 'instrument'
    version: 3

    id: string
    name: string
    gridIndex: number
    hits: SavedHitV1[]
}