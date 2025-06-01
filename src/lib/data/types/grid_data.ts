import type { HitDtoId, InstrumentDtoId } from './instrument_data';

export type GridDtoId = string;

export type GridDto = {
	id: GridDtoId;
	index: number;
	config: GridConfigDto;
	rows: GridRowDto[];
	currentlyPlayingColumn: number;
	msPerBeatDivision: number;
	gridCols: number;
	playing: boolean;
};

export type GridConfigDto = {
	name: string | undefined;
	bpm: number;
	bars: number;
	beatsPerBar: number;
	beatDivisions: number;
	repetitions: number;
};

export type GridRowDto = {
	instrumentId: InstrumentDtoId;
	cells: GridCellDto[];
};

export type GridCellDto = {
	hits: InstrumentHitDto[];
	cells_occupied: number;
};

export type InstrumentHitDto = {
	instrumentId: InstrumentDtoId;
	hitId: HitDtoId;
};
