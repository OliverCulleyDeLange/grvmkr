import type { Grid, GridId, InstrumentId, InstrumentWithId } from "$lib";

export interface GridRepositoryI {
    initialise(initialGrids: Map<GridId, Grid>, instruments: Map<InstrumentId, InstrumentWithId>): Promise<Map<GridId, Grid>>;
	getFirstGrid(): Grid | null;
	getMostRecentlyPlayedGrid(): Grid | null;
	setPlaying(gridId: GridId, playing: boolean): void;
    replaceGrids(grids: Grid[], persist: boolean): unknown;
}