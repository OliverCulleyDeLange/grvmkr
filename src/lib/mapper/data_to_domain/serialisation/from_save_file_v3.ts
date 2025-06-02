import {
	calculateMsPerBeatDivision,
	generateGridId,
	InstrumentStore,
	type Grid,
	type GridCell,
	type GridRow,
	type InstrumentId,
	type InstrumentWithId,
	type SavedGridCellV3,
	type SavedGridV3
} from '$lib';

// Maps a saved grid from a save file to grid models
export function mapSavedGridV3ToGrid(
	savedGrid: SavedGridV3,
	gridIndex: number,
	instruments: Map<InstrumentId, InstrumentWithId>
): Grid {
	let newRows: GridRow[] = savedGrid.rows
		.map((savedRow, i) => {
			let instrument = instruments.get(savedRow.instrument_id);
			if (instrument) {
				let gridRow: GridRow = {
					instrument: instrument,
					cells: savedRow.cells.map((savedCell) => mapSavedCellToGridCell(savedCell))
				};
				return gridRow;
			} else {
				console.error(
					`Failed to import grid row ${i}. Couldn't find instrument ${savedRow.instrument_id}`,
					savedRow
				);
				return null;
			}
		})
		.filter((r) => r != null);

	let grid: Grid = {
		id: generateGridId(),
		index: gridIndex,
		config: {
			name: savedGrid.config.name,
			bpm: savedGrid.config.bpm,
			bars: savedGrid.config.bars,
			beatsPerBar: savedGrid.config.beats_per_bar,
			beatDivisions: savedGrid.config.beat_divisions,
			repetitions: 1
		},
		rows: newRows,
		msPerBeatDivision: calculateMsPerBeatDivision(
			savedGrid.config.bpm,
			savedGrid.config.beat_divisions
		),
		gridCols:
			savedGrid.config.bars * (savedGrid.config.beats_per_bar * savedGrid.config.beat_divisions),
		playing: false,
		currentlyPlayingColumn: 0,
		toolsExpanded: false,
	};
	return grid;
}

function mapSavedCellToGridCell(savedCell: SavedGridCellV3): GridCell {
	let gridCell: GridCell = {
		cells_occupied: savedCell.cells_occupied,
		hits: savedCell.hits.map((hit) => {
			return {
				hitId: hit.hit_id,
				instrumentId: hit.instrument_id
			};
		}),
		selected: false
	};
	return gridCell;
}
