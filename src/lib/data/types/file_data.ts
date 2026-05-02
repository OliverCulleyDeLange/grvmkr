import type { GridDtoId, InstrumentId } from '$lib';

export type FileDtoId = string;

// A file is made up of many grids
export type FileDto = {
	id: FileDtoId;
	name: string;
	grids: GridDtoId[];
	instruments: InstrumentId[];
	// Volume (0-1) per instrument id. Optional for files saved before this was tracked.
	instrumentVolumes?: Record<InstrumentId, number>;
};
