import {
	type Grid,
	type GridCell,
	type GridRow,
	type InstrumentHit,
	type InstrumentWithId,
	type SavedGridCellV3,
	type SavedGridRowV3,
	type SavedGridV5,
	type SavedHitV1,
	type SavedInstrumentHitV1,
	type SavedInstrumentV4,
	type SaveFileV5
} from '$lib';

// Serialises the grid model state into a SaveFileV4 for reloading later
export function serialiseToSaveFileV5(
	name: string,
	grids: Grid[],
	instruments: InstrumentWithId[]
): SaveFileV5 {
	let savedInstruments: SavedInstrumentV4[] = mapInstrumentsToSavedInstrumentsV4(instruments);
	let savedGrids: SavedGridV5[] = mapGridsToSavedGridV5(grids);

	let saveFile: SaveFileV5 = {
		type: 'savefile',
		version: 5,
		name: name,
		instruments: savedInstruments,
		grids: savedGrids
	};
	return saveFile;
}

function mapGridsToSavedGridV5(grids: Grid[]): SavedGridV5[] {
	return grids.map((grid) => {
		let savedGridRows: SavedGridRowV3[] = mapGridToSavedGridRowsV3(grid);
		let savedGrid: SavedGridV5 = {
			type: 'grid',
			version: 5,
			id: grid.id,
			index: grid.index,
			config: {
				name: grid.config.name,
				bpm: grid.config.bpm,
				bars: grid.config.bars,
				beats_per_bar: grid.config.beatsPerBar,
				beat_divisions: grid.config.beatDivisions,
				repetitions: grid.config.repetitions,
			},
			rows: savedGridRows
		};
		return savedGrid;
	});
}

export function mapGridToSavedGridRowsV3(grid: Grid): SavedGridRowV3[] {
	let savedGridRows: SavedGridRowV3[] = grid.rows.map((row) => {
		return mapRowToSavedGridRowV3(row);
	});
	return savedGridRows;
}

function mapRowToSavedGridRowV3(row: GridRow): SavedGridRowV3 {
	let cells: SavedGridCellV3[] = row.cells.map((cell) => mapCellToSavedCellV3(cell));
	let savedGridRow: SavedGridRowV3 = {
		instrument_id: row.instrument.id,
		cells
	};
	return savedGridRow;
}

function mapCellToSavedCellV3(cell: GridCell): SavedGridCellV3 {
	return {
		cells_occupied: cell.cells_occupied,
		hits: cell.hits.map((hit) => mapHitToSavedInstrumentHitV1(hit))
	};
}

function mapHitToSavedInstrumentHitV1(hit: InstrumentHit): SavedInstrumentHitV1 {
	let savedHit: SavedInstrumentHitV1 = {
		instrument_id: hit.instrumentId ?? '',
		hit_id: hit.hitId ?? ''
	};
	return savedHit;
}

function mapInstrumentsToSavedInstrumentsV4(instruments: InstrumentWithId[]): SavedInstrumentV4[] {
	return instruments.map((instrument) => {
		let savedHits: SavedHitV1[] = mapInstrumentToSavedHitsV1(instrument);

		let savedInstrument: SavedInstrumentV4 = {
			type: 'instrument',
			version: 4,
			id: instrument.id,
			name: instrument.name,
			hits: savedHits,
			gridIndex: instrument.gridIndex,
			volume: instrument.volume
		};
		return savedInstrument;
	});
}

function mapInstrumentToSavedHitsV1(instrument: InstrumentWithId): SavedHitV1[] {
	return [...instrument.hitTypes.values()].map((hit) => {
		let savedHit: SavedHitV1 = {
			type: 'hit',
			version: 1,
			id: hit.id,
			key: hit.key as string,
			description: hit.description ?? '',
			audio_file_name: hit.audioFileName
		};
		return savedHit;
	});
}
