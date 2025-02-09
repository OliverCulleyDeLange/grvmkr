import { mapInstrumentsToSavedInstrumentsV1, type Bar, type Beat, type BeatDivision, type Grid, type GridRow, type InstrumentHit, type InstrumentWithId, type Notation, type SaveFileV3, type SavedBarV3, type SavedBeatDivisionV3, type SavedBeatV3, type SavedGridRowV3, type SavedGridV3, type SavedInstrumentHitV1, type SavedInstrumentV1, type SavedNotationV3 } from "$lib";

// Serialises the grid model state into a SaveFileV2 for reloading later
export function serialiseToSaveFileV3(name: string, grids: Grid[], instruments: InstrumentWithId[]): SaveFileV3 {
    let savedInstruments: SavedInstrumentV1[] = mapInstrumentsToSavedInstrumentsV1(instruments);
    let savedGrids: SavedGridV3[] = mapGridsToSavedGridV3(grids)

    let saveFile: SaveFileV3 = {
        type: "savefile",
        version: 3,
        name: name,
        instruments: savedInstruments,
        grids: savedGrids
    }
    return saveFile
}

function mapGridsToSavedGridV3(grids: Grid[]): SavedGridV3[] {
    return grids.map((grid) => {
        let savedGridRows: SavedGridRowV3[] = mapGridToSavedGridRowsV3(grid)
        let savedGrid: SavedGridV3 = {
            type: "grid",
            version: 3,
            id: grid.id,
            config: {
                name: grid.config.name,
                bpm: grid.config.bpm,
                bars: grid.config.bars,
                beats_per_bar: grid.config.beatsPerBar,
                beat_divisions: grid.config.beatDivisions
            },
            rows: savedGridRows,
        }
        return savedGrid
    })
}


export function mapGridToSavedGridRowsV3(grid: Grid): SavedGridRowV3[] {
    let savedGridRows: SavedGridRowV3[] = [...grid.rows.values()].map((row) => {
        return mapRowToSavedGridRowV3(row);
    })
    return savedGridRows
}

function mapRowToSavedGridRowV3(row: GridRow): SavedGridRowV3 {
    let notation: SavedNotationV3 = mapNotationToSavedNotationV3(row.notation)
    let savedGridRow: SavedGridRowV3 = {
        instrument_id: row.instrument.id,
        notation
    };
    return savedGridRow;
}

function mapNotationToSavedNotationV3(notation: Notation): SavedNotationV3 {
    return {
        bars: notation.bars.map((bar) => mapBarToSavedBarV3(bar))
    }
}

function mapBarToSavedBarV3(bar: Bar): SavedBarV3 {
    return {
        beats: bar.beats.map((beat) => mapBeatToSavedBeatV3(beat))
    }
}

function mapBeatToSavedBeatV3(beat: Beat): SavedBeatV3 {
    return {
        divisions: beat.divisions.map((division) => mapDivisionToSavedDivisionV3(division))
    }
}

function mapDivisionToSavedDivisionV3(division: BeatDivision): SavedBeatDivisionV3 {
    return {
        cellsOccupied: division.cellsOccupied,
        hits: division.hits.map((hit) => mapHitToSavedInstrumentHitV1(hit))
    };
}

function mapHitToSavedInstrumentHitV1(hit: InstrumentHit): SavedInstrumentHitV1 {
    let savedHit: SavedInstrumentHitV1 = {
        instrument_id: hit.instrumentId ?? "",
        hit_id: hit.hitId ?? ""
    };
    return savedHit;
}