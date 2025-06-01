import type { Grid, GridId, GrvMkrFile, InstrumentWithId } from "$lib";

export interface FileRepositoryI {
    setGrids(grids: Map<GridId, Grid>): void;
    getFile(): GrvMkrFile;
    setInstruments(instruments: Map<string, InstrumentWithId>): void;
    saveWorkingFileInStateAndDB(file: GrvMkrFile): void;
    loadFile(file: GrvMkrFile): void;
}