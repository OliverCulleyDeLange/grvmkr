import type { GridModel, SaveFileV1, InstrumentWithId, SavedInstrumentV1, SavedHitV1, SavedGridV1, SavedGridRowV1, SavedInstrumentHitV1, GridRow, Bar, Beat, BeatDivision } from "$lib";

export function serialiseToJsonV1(grids: GridModel[], instruments: InstrumentWithId[]): SaveFileV1 {
    let savedInstruments: SavedInstrumentV1[] = mapInstrumentsToSavedInstruments(instruments);
    let savedGrids: SavedGridV1[] = mapGrids(grids)

    let saveFile: SaveFileV1 = {
        type: "savefile",
        version: 1,
        instruments: savedInstruments,
        grids: savedGrids
    }
    return saveFile
}

function mapGrids(grids: GridModel[]): SavedGridV1[] {
    return grids.map((grid) => {
        let savedGridRows: SavedGridRowV1[] = mapRows(grid)
        let savedGrid: SavedGridV1 = {
            type: "grid",
            version: 1,
            config: {
                bpm: grid.bpm,
                bars: grid.bars,
                beats_per_bar: grid.beatsPerBar,
                beat_divisions: grid.beatNoteFraction
            },
            rows: savedGridRows
        }
        return savedGrid
    })
}

function mapRows(grid: GridModel): SavedGridRowV1[] {
    let savedGridRows: SavedGridRowV1[] = [...grid.rows.values()].map((row) => {
        return mapRowToSavedGridRow(row);
    })
    return savedGridRows
}

function mapRowToSavedGridRow(row: GridRow): SavedGridRowV1 {
    let hits: SavedInstrumentHitV1[] = [...row.notation.bars.values()].flatMap((bar) => {
        return mapBarToSavedInstrumentHits(bar);
    });
    let savedGridRow: SavedGridRowV1 = {
        hits: hits
    };
    return savedGridRow;
}

function mapBarToSavedInstrumentHits(bar: Bar): SavedInstrumentHitV1[] {
    return [...bar.beats.values()].flatMap((beat) => mapBeatToSavedInstrumentHits(beat));
}

function mapBeatToSavedInstrumentHits(beat: Beat): SavedInstrumentHitV1[] {
    return [...beat.divisions.values()].flatMap((division) => mapDivisionToSavedInstrumentHit(division));
}

function mapDivisionToSavedInstrumentHit(division: BeatDivision): SavedInstrumentHitV1 {
    let savedHit: SavedInstrumentHitV1 = {
        instrument_id: division.hit?.instrumentId ?? "",
        hit_id: division.hit?.hitId ?? ""
    };
    return savedHit;
}

function mapInstrumentsToSavedInstruments(instruments: InstrumentWithId[]): SavedInstrumentV1[] {
    return instruments.map((instrument) => {
        let savedHits: SavedHitV1[] = mapInstrumentToSavedHits(instrument);

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

function mapInstrumentToSavedHits(instrument: InstrumentWithId): SavedHitV1[] {
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
