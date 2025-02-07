import type { Bar, Beat, BeatDivision, Grid, GridRow, InstrumentWithId, SavedGridRowV1, SavedGridV1, SavedHitV1, SavedInstrumentHitV1, SavedInstrumentV1, SaveFileV1 } from "$lib";

// Serialises the grid model state into a SaveFileV1 for reloading later
export function serialiseToSaveFileV1(grids: Grid[], instruments: InstrumentWithId[]): SaveFileV1 {
    let savedInstruments: SavedInstrumentV1[] = mapInstrumentsToSavedInstrumentsV1(instruments);
    let savedGrids: SavedGridV1[] = mapGridsV1(grids)

    let saveFile: SaveFileV1 = {
        type: "savefile",
        version: 1,
        instruments: savedInstruments,
        grids: savedGrids
    }
    return saveFile
}

export function mapGridsV1(grids: Grid[]): SavedGridV1[] {
    return grids.map((grid) => {
        let savedGridRows: SavedGridRowV1[] = mapGridToSavedGridRowsV1(grid)
        let savedGrid: SavedGridV1 = {
            type: "grid",
            version: 1,
            id: grid.id,
            config: {
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

export function mapGridToSavedGridRowsV1(grid: Grid): SavedGridRowV1[] {
    let savedGridRows: SavedGridRowV1[] = [...grid.rows.values()].map((row) => {
        return mapRowToSavedGridRowV1(row);
    })
    return savedGridRows
}

function mapRowToSavedGridRowV1(row: GridRow): SavedGridRowV1 {
    let hits: SavedInstrumentHitV1[] = [...row.notation.bars.values()].flatMap((bar) => {
        return mapBarToSavedInstrumentHitsV1(bar);
    });
    let savedGridRow: SavedGridRowV1 = {
        instrument_id: row.instrument.id,
        hits: hits
    };
    return savedGridRow;
}

function mapBarToSavedInstrumentHitsV1(bar: Bar): SavedInstrumentHitV1[] {
    return [...bar.beats.values()].flatMap((beat) => mapBeatToSavedInstrumentHitsV1(beat));
}

function mapBeatToSavedInstrumentHitsV1(beat: Beat): SavedInstrumentHitV1[] {
    return [...beat.divisions.values()].flatMap((division) => mapDivisionToSavedInstrumentHitV1(division));
}

function mapDivisionToSavedInstrumentHitV1(division: BeatDivision): SavedInstrumentHitV1 {
    let savedHit: SavedInstrumentHitV1 = {
        instrument_id: division.hit?.instrumentId ?? "",
        hit_id: division.hit?.hitId ?? ""
    };
    return savedHit;
}

export function mapInstrumentsToSavedInstrumentsV1(instruments: InstrumentWithId[]): SavedInstrumentV1[] {
    return instruments.map((instrument) => {
        let savedHits: SavedHitV1[] = mapInstrumentToSavedHitsV1(instrument);

        let savedInstrument: SavedInstrumentV1 = {
            type: "instrument",
            version: 1,
            id: instrument.id,
            name: instrument.name,
            hits: savedHits
        };
        return savedInstrument;
    });
}

function mapInstrumentToSavedHitsV1(instrument: InstrumentWithId): SavedHitV1[] {
    return [...instrument.hitTypes.values()].map((hit) => {
        let savedHit: SavedHitV1 = {
            type: "hit",
            version: 1,
            id: hit.id,
            key: hit.key as string,
            description: hit.description ?? "",
            audio_file_name: hit.audioFileName
        };
        return savedHit;
    });
}
