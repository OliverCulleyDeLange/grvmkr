import {
	calculateMsPerBeatDivision,
	type GridCell,
	type Grid,
	type GridRow,
	type InstrumentStore,
	type SavedGridConfigV1,
	type SavedGridRowV1,
	type SavedGridV1,
	type SavedInstrumentHitV1,
	generateGridId,
	type InstrumentWithId,
	type InstrumentId
} from '$lib';

// Maps a saved grid from a save file to grid models
export function mapSavedGridV1ToGrid(
	savedGrid: SavedGridV1,
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
			name: '', // Doesn't exist in V1 save file
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

export function mapSavedInstrumentHitV1ToGridCell(
	savedHit: SavedInstrumentHitV1,
	hitIndex: number,
	config: SavedGridConfigV1
): GridCell {
	let hit =
		savedHit.hit_id && savedHit.instrument_id
			? {
					hitId: savedHit.hit_id,
					instrumentId: savedHit.instrument_id
				}
			: undefined;
	let beatDivision: GridCell = {
		cells_occupied: 1, // V1 doesn't support merging
		hits: hit ? [hit] : [],
		selected: false
	};
	return beatDivision;
}
