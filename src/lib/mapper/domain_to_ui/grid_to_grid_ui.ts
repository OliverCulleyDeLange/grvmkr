import {
	type BeatIndicatorUi,
	type CellTools,
	defaultVolume,
	type Grid,
	type GridCell,
	type GridCellUi,
	type GridConfig,
	type GridId,
	type GridRow,
	type GridRowUi,
	type GridUi,
	type GridUis,
	type InstrumentId,
	type InstrumentStore,
	type InstrumentWithId,
	type NotationSection,
	type VolumeControlUi
} from '$lib';

export function mapGridUi(
	grids: Map<GridId, Grid>,
	instrumentStore: InstrumentStore,
	screenWidth?: number,
): GridUis {
	let gridUis: GridUi[] = [...grids.values()].map((grid) =>
		mapRowsToGridUi(grid, instrumentStore, screenWidth)
	);
	let ui: GridUis = {
		grids: gridUis.sort((a, b) => a.index - b.index)
	};
	return ui;
}

export function mapRowsToGridUi(
	grid: Grid,
	instrumentManager: InstrumentStore,
	screenWidth?: number,
): GridUi {
	let instruments = instrumentManager.getInstruments();
	let rows = mapRows(grid, instruments);
	let sections = splitRowsIntoSections(rows, grid.config, grid.gridCols, screenWidth);

	let ui: GridUi = {
		notationSections: sections,
		id: grid.id,
		index: grid.index,
		config: grid.config, // Using a domain object for now- TODO replace with UI
		msPerBeatDivision: grid.msPerBeatDivision,
		gridCols: grid.gridCols,
		toolsExpanded: grid.toolsExpanded
	};
	return ui;
}

// Maps a domain grids rows into a list of GridRowUI
function mapRows(grid: Grid, instruments: Map<InstrumentId, InstrumentWithId>): GridRowUi[] {
	return grid.rows
		.map((row, rowI) => mapRow(row, rowI, instruments, grid.config, grid.id))
		.sort((a, b) => a.index - b.index);
}

function mapRow(
	row: GridRow,
	rowIndex: number,
	instruments: Map<string, InstrumentWithId>,
	config: GridConfig,
	gridId: string
): GridRowUi {
	let gridCells: GridCellUi[] = row.cells
		.map((cell, cellIndex) => {
			if (cell.cells_occupied < 1) {
				return;
			} else {
				return mapCellToCellUi(cell, row.instrument, cellIndex, config, gridId, rowIndex);
			}
		})
		.filter((x) => x != undefined);
	let instrument = instruments.get(row.instrument.id);
	let volume: VolumeControlUi = {
		volume: instrument?.volume ?? defaultVolume,
		volumeString:
			instrument?.volume != undefined ? `${Math.round(instrument.volume * 100)}%` : '80%',
		muted: instrument?.muted ?? false,
		soloed: instrument?.soloed ?? false
	};
	let rowUi: GridRowUi = {
		index: row.instrument.gridIndex,
		instrumentId: instrument?.id ?? 'error',
		instrumentName: instrument?.name ?? 'error',
		gridCells,
		volume
	};
	return rowUi;
}

function mapCellToCellUi(
	cell: GridCell,
	instrument: InstrumentWithId,
	cellIndex: number,
	config: GridConfig,
	gridId: string,
	rowIndex: number
): GridCellUi {
	let cellContent = '';
	cell.hits.forEach((instrumentHit) => {
		let hit = instrument?.hitTypes.get(instrumentHit.hitId);
		if (hit) {
			cellContent += hit.key;
		}
	});
	let bar = Math.floor((cellIndex / (config.beatDivisions * config.beatsPerBar)) % config.bars);
	let beat = Math.floor((cellIndex / config.beatDivisions) % config.beatsPerBar);
	let beat_division = cellIndex % config.beatDivisions;
	let cellUi: GridCellUi = {
		isBeat: cellIndex % config.beatDivisions == 0,
		isFirstBeatOfBar: cellIndex % (config.beatsPerBar * config.beatDivisions) == 0,
		content: cellContent,
		locator: {
			grid: gridId,
			row: rowIndex,
			cell: cellIndex
		},
		cellsOccupied: cell.cells_occupied,
		cellDescription: `${bar + 1}.${beat + 1}.${beat_division + 1}`,
		addColorTint: instrument.gridIndex % 2 == 1
	};
	return cellUi;
}

// Splits the grid UI into manageable sections based on screen width and min cell width
function splitRowsIntoSections(
	rows: GridRowUi[],
	config: GridConfig,
	gridCols: number,
	screenWidth?: number,
): NotationSection[] {
	const sections: NotationSection[] = [];
	let chunkSize: number;
	const barSize = gridCols / config.bars;
	if (screenWidth) {
		const minCellWidth = 20; // Minimum width of a cell in pixels
		const maxCellsPerSection = Math.max(1, Math.floor(screenWidth / minCellWidth));
		// Find the largest multiple of barSize that fits in maxCellsPerSection
		const barsPerSection = Math.max(1, Math.floor(maxCellsPerSection / barSize));
		chunkSize = barsPerSection * barSize;
		// Ensure at least one bar per section
		if (chunkSize < barSize) chunkSize = barSize;
		// Don't exceed total columns
		if (chunkSize > gridCols) chunkSize = gridCols;
	} else {
		chunkSize = barSize * 2; // Fallback: 2 bars per section
		if (chunkSize > 32) {
			chunkSize = barSize; // Fallback: 1 bar per section if > 32 cells
		}
	}
	const numSections = Math.ceil(gridCols / chunkSize);

	for (let i = 0; i < numSections; i++) {
		let min = i * chunkSize;
		let max = (i + 1) * chunkSize;
		const sectionRows: GridRowUi[] = rows.map((row) => {
			let gridRowUi = {
				...row,
				gridCells: row.gridCells.reduce(
					(acc, cell, index, arr) => {
						if (acc.cnt >= min && acc.cnt < max) {
							acc.acc.push(cell);
						}
						acc.cnt += cell.cellsOccupied;
						return acc;
					},
					{ cnt: 0, acc: [] as GridCellUi[] }
				).acc
			};
			return gridRowUi;
		});
		if (sectionRows.length == 0) continue;

		let sectionColumns = sectionRows[0].gridCells.reduce(
			(acc, cell) => acc + cell.cellsOccupied,
			0
		);
		sections.push({
			sectionRows,
			minIndex: min,
			columns: sectionColumns
		});
	}

	return sections;
}
