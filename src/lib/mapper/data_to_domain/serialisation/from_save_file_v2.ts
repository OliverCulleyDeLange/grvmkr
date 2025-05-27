import {
	calculateMsPerBeatDivision,
	type GridCell,
	type Grid,
	type GridRow,
	type InstrumentStore,
	type SavedGridConfigV1,
	type SavedGridRowV1,
	type SavedGridV1,
	type SavedGridV2,
	type SavedInstrumentHitV1,
	mapSavedInstrumentHitV1ToGridCell,
	generateGridId,
	type InstrumentWithId,
	type InstrumentId
} from '$lib';

// Maps a saved grid from a save file to grid models
export function mapSavedGridV2ToGrid(
	savedGrid: SavedGridV2,
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
		index: 0, // Not present in V2
		config: {
			name: savedGrid.config.name,
			bpm: savedGrid.config.bpm,
			bars: savedGrid.config.bars,
			beatsPerBar: savedGrid.config.beats_per_bar,
			beatDivisions: savedGrid.config.beat_divisions
		},
		rows: newRows,
		msPerBeatDivision: calculateMsPerBeatDivision(
			savedGrid.config.bpm,
			savedGrid.config.beat_divisions
		),
		gridCols:
			savedGrid.config.bars * (savedGrid.config.beats_per_bar * savedGrid.config.beat_divisions),
		playing: false,
		currentlyPlayingColumn: 0
	};
	return grid;
}
