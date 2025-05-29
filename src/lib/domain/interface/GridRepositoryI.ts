import type { Grid, GridId, InstrumentId, InstrumentWithId } from "$lib";

export interface GridRepositoryI {
    getGridsFromCurrentlyPlaying(): Grid[];
	getGridsFromMostRecentlyPlayedGrid(): Grid[];
    updatePlaying(newPlaying: boolean, gridId: string): unknown;
    initialise(initialGrids: Map<GridId, Grid>, instruments: Map<InstrumentId, InstrumentWithId>): Promise<Map<GridId, Grid>>;
	getFirstGrid(): Grid | null;
    replaceGrids(grids: Grid[], persist: boolean): unknown;
}