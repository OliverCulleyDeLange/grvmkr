import type { CellLocator, Grid, GridId, InstrumentId, InstrumentWithId } from '$lib';

export interface GridRepositoryI {
	getCurrentlySelectedCells(): CellLocator[];
	getGridOfCurrentlySelectedCell(): Grid | null;
	syncInstruments(instruments: Map<InstrumentId, InstrumentWithId>): Promise<void>;
	initialise(
		initialGrids: Map<GridId, Grid>,
		instruments: Map<InstrumentId, InstrumentWithId>
	): Promise<Map<GridId, Grid>>;
	getGrid(gridId: GridId): Grid | null;
	getGrids(): Map<GridId, Grid>;
	getFirstGrid(): Grid | null;
	getGridsFrom(gridId: GridId): Grid[];
	replaceGrids(grids: Grid[], persist: boolean): Promise<void>;
	scrollToGrid(id: string): void;
}
