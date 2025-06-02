import {
	calculateMsPerBeatDivision,
	generateGridId,
	mapSavedInstrumentHitV1ToGridCell,
	type Grid,
	type GridRow,
	type InstrumentId,
	type InstrumentWithId,
	type SavedGridV2
} from '$lib';

// Maps a saved grid from a save file to grid models
export function mapSavedGridV2ToGrid(
	savedGrid: SavedGridV2,
	gridIndex: number,
	instruments: Map<InstrumentId, InstrumentWithId>
): Grid {
	let newRows: GridRow[] = savedGrid.rows
		.map((row, i) => {
			let instrument = instruments.get(row.instrument_id);
			if (instrument) {
				let gridRow: GridRow = {
					instrument: instrument,
					cells: row.hits.map((hit, i) =>
						mapSavedInstrumentHitV1ToGridCell(hit, i, savedGrid.config)
					)
				};
				return gridRow;
			} else {
				console.error(
					`Failed to import grid row ${i}. Couldn't find instrument ${row.instrument_id}`,
					row
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
		toolsExpanded: false
	};
	return grid;
}
