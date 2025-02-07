import { type Grid, type InstrumentWithId, type SaveFileV2, type SavedGridRowV1, type SavedGridV2, type SavedInstrumentV1, mapGridToSavedGridRowsV1, mapInstrumentsToSavedInstrumentsV1 } from "$lib";

// Serialises the grid model state into a SaveFileV2 for reloading later
export function serialiseToSaveFileV2(name: string, grids: Grid[], instruments: InstrumentWithId[]): SaveFileV2 {
    let savedInstruments: SavedInstrumentV1[] = mapInstrumentsToSavedInstrumentsV1(instruments);
    let savedGrids: SavedGridV2[] = mapGridsToSavedGridV2(grids)

    let saveFile: SaveFileV2 = {
        type: "savefile",
        version: 2,
        name: name,
        instruments: savedInstruments,
        grids: savedGrids
    }
    return saveFile
}

function mapGridsToSavedGridV2(grids: Grid[]): SavedGridV2[] {
    return grids.map((grid) => {
        let savedGridRows: SavedGridRowV1[] = mapGridToSavedGridRowsV1(grid)
        let savedGrid: SavedGridV2 = {
            type: "grid",
            version: 2,
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
