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
	InstrumentHitDto,
	InstrumentStore,
	InstrumentWithId
} from '$lib';

export function mapGridDtoToGrid(
	gridDto: GridDto,
	instruments: Map<string, InstrumentWithId>
): Grid {
	return {
		id: gridDto.id,
		index: gridDto.index,
		config: configFromDto(gridDto.config),
		rows: gridDto.rows.map((row) => rowFromDto(row, instruments.get(row.instrumentId)!)),
		msPerBeatDivision: gridDto.msPerBeatDivision,
		gridCols: gridDto.gridCols,
		toolsExpanded: false
	};
}

export function configFromDto(configDto: GridConfigDto): GridConfig {
	return {
		name: configDto.name ?? '',
		bpm: configDto.bpm,
		bars: configDto.bars,
		beatsPerBar: configDto.beatsPerBar,
		beatDivisions: configDto.beatDivisions,
		repetitions: configDto.repetitions
	};
}

export function rowFromDto(gridRowDto: GridRowDto, instrument: InstrumentWithId): GridRow {
	return {
		instrument: instrument,
		cells: gridRowDto.cells.map((cell) => mapGridCellDtoToGridCell(cell))
	};
}

export function mapGridCellDtoToGridCell(divisionDto: GridCellDto): GridCell {
	let cell: GridCell = {
		hits: divisionDto.hits.map((hit) => mapInstrumentHitDtoToInstrumentHit(hit)),
		cells_occupied: divisionDto.cells_occupied
	};
	return cell;
}

export function mapInstrumentHitDtoToInstrumentHit(hitDto: InstrumentHitDto): InstrumentHit {
	return {
		instrumentId: hitDto.instrumentId,
		hitId: hitDto.hitId
	};
}
