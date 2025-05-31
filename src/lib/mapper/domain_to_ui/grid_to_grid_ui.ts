import {
	type BeatIndicator,
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
	mapCellToolsUi,
	type NotationSection,
	type VolumeControlUi
} from '$lib';

export function mapGridUi(
	grids: Map<GridId, Grid>,
	instrumentManager: InstrumentStore,
	cellTools: CellTools | undefined
): GridUis {
	let gridUis: GridUi[] = [...grids.values()].map((grid) =>
		mapRowsToGridUi(grid, instrumentManager, cellTools)
	);
	let ui: GridUis = {
		grids: gridUis.sort((a, b) => a.index - b.index)
	};
	return ui;
}

export function mapRowsToGridUi(
	grid: Grid,
	instrumentManager: InstrumentStore,
	cellTools: CellTools | undefined
): GridUi {
	let instruments = instrumentManager.instruments;
	let rows = mapRows(grid, instruments);
	let sections = splitRowsIntoSections(
		rows,
		grid.config,
		grid.gridCols,
		grid.currentlyPlayingColumn
	);

	let ui: GridUi = {
		notationSections: sections,
		id: grid.id,
		index: grid.index,
		config: grid.config, // Using a domain object for now- TODO replace with UI
		msPerBeatDivision: grid.msPerBeatDivision,
		gridCols: grid.gridCols,
		playing: grid.playing,
		currentlyPlayingColumn: grid.currentlyPlayingColumn,
		cellTools: mapCellToolsUi(cellTools, grid.id)
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
		selected: cell.selected,
		addColorTint: instrument.gridIndex % 2 == 1
	};
	return cellUi;
}

// Splits the grid UI into manageable 2 bar cell sections which stack vertically
function splitRowsIntoSections(
	rows: GridRowUi[],
	config: GridConfig,
	gridCols: number,
	currentlyPlayingColumn: number
): NotationSection[] {
	const sections: NotationSection[] = [];
	let chunkSize = (gridCols / config.bars) * 2; // Start with 2 bars per section
	if (chunkSize > 32) {
		chunkSize = gridCols / config.bars; // But downsize to 1 bar per section if > 32 cells
	}
	const numSections = Math.ceil(gridCols / chunkSize);

	for (let i = 0; i < numSections; i++) {
		let min = i * chunkSize; // 0
		let max = (i + 1) * chunkSize; //16
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
		const beatIndicator: BeatIndicator[] = Array.from({ length: sectionColumns }, (_, i) => {
			let text = '';
			let index = min + i;

			const playing = index == currentlyPlayingColumn;
			const divisionModulo = index % config.beatDivisions;
			const isBeat = divisionModulo == 0;
			const isFirstBeatOfBar = isBeat && index % (config.beatsPerBar * config.beatDivisions) == 0;
			const isAndBeatOfBar = divisionModulo == config.beatDivisions * 0.5;
			const isEBeatOfBar = divisionModulo == config.beatDivisions * 0.25;
			const isABeatOfBar = divisionModulo == config.beatDivisions * 0.75;
			if (isBeat) {
				text = `${((index / config.beatDivisions) % config.beatsPerBar) + 1}`;
			} else if (isAndBeatOfBar) {
				text = '&';
			} else if (isEBeatOfBar) {
				text = 'e';
			} else if (isABeatOfBar) {
				text = 'a';
			}
			const indicator: BeatIndicator = { isFirstBeatOfBar, isBeat, playing, text };
			return indicator;
		});
		sections.push({
			sectionRows,
			columns: sectionColumns,
			beatIndicator
		});
	}

	return sections;
}
