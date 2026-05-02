import type { Grid, GridId, InstrumentId, InstrumentWithId } from '$lib';

export type GrvMkrFileId = string;

// A file is made up of many grids and many instruments
export type GrvMkrFile = {
	id: GrvMkrFileId;
	name: string;
	grids: Map<GridId, Grid>;
	instruments: Map<InstrumentId, InstrumentWithId>;
	// Volume (0-1) per instrument id. Optional for files saved before this was tracked.
	instrumentVolumes?: Record<InstrumentId, number>;
};
