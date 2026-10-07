import {
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
	type InstrumentWithId,
	type GridSection,
	type VolumeControlUi
} from '$lib';
import { calculateGridSectionConfig } from '$lib/util/gridSectionUtils';

export function mapGridUi(
	grids: Map<GridId, Grid>,
	instruments: Map<InstrumentId, InstrumentWithId>,
	screenWidth?: number,
	instrumentVolumes?: Record<InstrumentId, number>
): GridUis {
	const gridUis: GridUi[] = [...grids.values()].map((grid) =>
		mapRowsToGridUi(grid, instruments, screenWidth, instrumentVolumes)
	);
	const ui: GridUis = {
		grids: gridUis.sort((a, b) => a.index - b.index)
	};
	return ui;
}

export function mapRowsToGridUi(
	grid: Grid,
	instruments: Map<InstrumentId, InstrumentWithId>,
	screenWidth?: number,
	instrumentVolumes?: Record<InstrumentId, number>
): GridUi {
	const rows = mapRows(grid, instruments, instrumentVolumes);
	const sections = splitRowsIntoSections(grid.id, rows, grid.config, grid.gridCols, screenWidth);

	const ui: GridUi = {
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
function mapRows(
	grid: Grid,
	instruments: Map<InstrumentId, InstrumentWithId>,
	instrumentVolumes?: Record<InstrumentId, number>
): GridRowUi[] {
	return grid.rows
		.map((row, rowI) => mapRow(row, rowI, instruments, grid.config, grid.id, instrumentVolumes))
		.sort((a, b) => a.index - b.index);
}

function mapRow(
	row: GridRow,
	rowIndex: number,
	instruments: Map<string, InstrumentWithId>,
	config: GridConfig,
	gridId: string,
	instrumentVolumes?: Record<InstrumentId, number>
): GridRowUi {
	const gridCells: GridCellUi[] = row.cells
		.map((cell, cellIndex) => {
			if (cell.cells_occupied < 1) {
				return;
			} else {
				return mapCellToCellUi(cell, row.instrument, cellIndex, config, gridId, rowIndex);
			}
		})
		.filter((x) => x != undefined);
	const instrument = instruments.get(row.instrument.id);
	const volume = instrumentVolumes?.[row.instrument.id] ?? defaultVolume;
	const volumeControl: VolumeControlUi = {
		volume: volume,
		volumeString: `${Math.round(volume * 100)}%`,
		muted: instrument?.muted ?? false,
		soloed: instrument?.soloed ?? false
	};
	const rowUi: GridRowUi = {
		index: row.instrument.gridIndex,
		instrumentId: instrument?.id ?? 'error',
		instrumentName: instrument?.name ?? 'error',
		gridCells,
		volume: volumeControl
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
		const hit = instrument?.hitTypes.get(instrumentHit.hitId);
		if (hit) {
			cellContent += hit.key;
		}
	});
	const bar = Math.floor((cellIndex / (config.beatDivisions * config.beatsPerBar)) % config.bars);
	const beat = Math.floor((cellIndex / config.beatDivisions) % config.beatsPerBar);
	const beat_division = cellIndex % config.beatDivisions;
	const cellUi: GridCellUi = {
		id: `${gridId}-${rowIndex}-${cellIndex}`,
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
		addColorTint: instrument ? instrument.gridIndex % 2 == 1 : false
	};
	return cellUi;
}

// Splits the grid UI into manageable sections based on screen width and min cell width
function splitRowsIntoSections(
	gridId: GridId,
	rows: GridRowUi[],
	config: GridConfig,
	gridCols: number,
	screenWidth?: number
): GridSection[] {
	const sections: GridSection[] = [];
	const sectionConfig = calculateGridSectionConfig(gridCols, config, screenWidth);
	const { chunkSize, numSections } = sectionConfig;

	for (let i = 0; i < numSections; i++) {
		const min = i * chunkSize;
		const max = (i + 1) * chunkSize;
		const sectionRows: GridRowUi[] = rows.map((row) => {
			const gridRowUi = {
				...row,
				gridCells: row.gridCells.reduce(
					(acc, cell) => {
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

		const sectionColumns = sectionRows[0].gridCells.reduce(
			(acc, cell) => acc + cell.cellsOccupied,
			0
		);
		sections.push({
			id: { grid: gridId, index: i },
			index: i,
			sectionRows,
			minIndex: min,
			columns: sectionColumns
		});
	}

	return sections;
}
