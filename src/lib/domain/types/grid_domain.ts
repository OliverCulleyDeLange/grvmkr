import type { HitId, InstrumentId, InstrumentWithId } from './instrument_domain';

export type GridId = string;

export type Grid = {
	id: GridId;
	index: number;
	config: GridConfig;
	toolsExpanded: boolean;
	rows: GridRow[];
	msPerBeatDivision: number;
	gridCols: number;
	playing: boolean;
	currentlyPlayingColumn: number;
};

export type GridConfig = {
	name: string;
	bpm: number;
	bars: number;
	beatsPerBar: number;
	beatDivisions: number;
	repetitions: number;
};

export type GridRow = {
	instrument: InstrumentWithId;
	cells: GridCell[];
};

export type GridCell = {
	hits: InstrumentHit[];
	cells_occupied: number;
	selected: boolean;
};

export type InstrumentHit = {
	instrumentId: InstrumentId;
	hitId: HitId;
};

export type CellLocator = {
	grid: GridId;
	row: number;
	cell: number;
};
