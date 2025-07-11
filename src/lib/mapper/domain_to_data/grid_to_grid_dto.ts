import type {
	Grid,
	GridCell,
	GridCellDto,
	GridConfig,
	GridConfigDto,
	GridDto,
	GridRow,
	GridRowDto,
	InstrumentHit,
	InstrumentHitDto
} from '$lib';

export function mapGridToGridDto(grid: Grid): GridDto {
	return {
		id: grid.id,
		index: grid.index,
		config: mapGridConfigToGridConfigDto(grid.config),
		rows: grid.rows.map((row) => mapGridRowToGridRowDto(row)),
		msPerBeatDivision: grid.msPerBeatDivision,
		gridCols: grid.gridCols,
	};
}

export function mapGridConfigToGridConfigDto(config: GridConfig): GridConfigDto {
	return {
		name: config.name,
		bpm: config.bpm,
		bars: config.bars,
		beatsPerBar: config.beatsPerBar,
		beatDivisions: config.beatDivisions,
		repetitions: config.repetitions
	};
}

export function mapGridRowToGridRowDto(gridRow: GridRow): GridRowDto {
	return {
		instrumentId: gridRow.instrument.id,
		cells: gridRow.cells.map((cell) => mapCellToCellDto(cell))
	};
}

export function mapCellToCellDto(cell: GridCell): GridCellDto {
	let dto: GridCellDto = {
		hits: cell.hits.map((hit) => mapInstrumentHitToInstrumentHitDto(hit)),
		cells_occupied: cell.cells_occupied
	};
	return dto;
}

export function mapInstrumentHitToInstrumentHitDto(hit: InstrumentHit): InstrumentHitDto {
	return {
		instrumentId: hit.instrumentId,
		hitId: hit.hitId
	};
}
