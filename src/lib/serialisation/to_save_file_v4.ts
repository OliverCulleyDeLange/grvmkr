import {
	defaultVolume,
	type Grid,
	type GridCell,
	type GridRow,
	type InstrumentHit,
	type InstrumentWithId,
	type SavedGridCellV3,
	type SavedGridRowV3,
	type SavedGridV3,
	type SavedHitV1,
	type SavedInstrumentHitV1,
	type SavedInstrumentV1,
	type SavedInstrumentV3,
	type SavedInstrumentV4,
	type SaveFileV3,
	type SaveFileV4
} from '$lib';

// Serialises the grid model state into a SaveFileV4 for reloading later
export function serialiseToSaveFileV4(
	name: string,
	grids: Grid[],
	instruments: InstrumentWithId[]
): SaveFileV4 {
	let savedInstruments: SavedInstrumentV4[] = mapInstrumentsToSavedInstrumentsV4(instruments);
	let savedGrids: SavedGridV3[] = mapGridsToSavedGridV3(grids);

	let saveFile: SaveFileV4 = {
		type: 'savefile',
		version: 4,
		name: name,
		instruments: savedInstruments,
		grids: savedGrids
	};
	return saveFile;
}

function mapGridsToSavedGridV3(grids: Grid[]): SavedGridV3[] {
	return grids.map((grid) => {
		let savedGridRows: SavedGridRowV3[] = mapGridToSavedGridRowsV3(grid);
		let savedGrid: SavedGridV3 = {
			type: 'grid',
			version: 3,
			id: grid.id,
			config: {
				name: grid.config.name,
				bpm: grid.config.bpm,
				bars: grid.config.bars,
				beats_per_bar: grid.config.beatsPerBar,
				beat_divisions: grid.config.beatDivisions
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
