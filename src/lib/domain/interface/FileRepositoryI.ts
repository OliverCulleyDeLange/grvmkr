import type { Grid, GridId, GrvMkrFile, InstrumentWithId } from "$lib";

export interface FileRepositoryI {
    getFile(): GrvMkrFile;
    setGrids(grids: Map<GridId, Grid>): Promise<void>;
    setInstruments(instruments: Map<string, InstrumentWithId>): Promise<void>;
    saveWorkingFileInStateAndDB(file: GrvMkrFile): Promise<void>;
    loadFile(file: GrvMkrFile): Promise<void>;
}