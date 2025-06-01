import type { Grid, GridId, InstrumentId, InstrumentWithId } from "$lib";

export interface GridRepositoryI {
    initialise(initialGrids: Map<GridId, Grid>, instruments: Map<InstrumentId, InstrumentWithId>): Promise<Map<GridId, Grid>>;
	getGrid(gridId: GridId): Grid | null;
	getGrids(): Grid[];
	getFirstGrid(): Grid | null;
    getGridsFromCurrentlyPlaying(): Grid[];
	getGridsFromMostRecentlyPlayedGrid(): Grid[];
    updatePlaying(newPlaying: boolean, gridId: string): unknown;
    replaceGrids(grids: Grid[], persist: boolean): unknown;
    stopPlayingGrid(): void  
}