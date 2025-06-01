import type { Grid, GridCell, GridRow, InstrumentId, InstrumentWithId } from '$lib';

export function generateGridId(): string {
	return `grid_${crypto.randomUUID()}`;
}

// The values here are pre calculated
export function buildDefaultGrid(
	instruments: Map<InstrumentId, InstrumentWithId>,
	index: number
): Grid {
	let grid: Grid = {
		id: generateGridId(),
		index: index,
		config: {
			name: `Groove ${index + 1}`,
			bpm: 120,
			bars: 1,
			beatsPerBar: 4,
			beatDivisions: 4,
			repetitions: 1
		},
		rows: buildGridRows(instruments, 1, 4, 4),
		msPerBeatDivision: 125,
		gridCols: 16,
		playing: false,
		currentlyPlayingColumn: 0
	};
	return grid;
}

export function buildGridRows(
	instruments: Map<InstrumentId, InstrumentWithId>,
	bars: number,
	beats: number,
	divisions: number
): GridRow[] {
	return Array.from(instruments.values()).map((instrument) =>
		defaultGridRow(instrument, bars, beats, divisions)
	);
}

export function defaultGridRow(
	instrument: InstrumentWithId,
	bars: number,
	beats: number,
	divisions: number
): GridRow {
	return {
		instrument,
		cells: Array.from({ length: bars * beats * divisions }, (_, i) => {
			return {
				hits: [],
				cells_occupied: 1,
				selected: false
			} as GridCell;
		})
	};
}
