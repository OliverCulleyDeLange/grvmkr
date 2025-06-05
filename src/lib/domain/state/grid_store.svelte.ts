import type { HitId, HitTypeWithId, InstrumentId, InstrumentWithId } from '$lib';
import {
	ProblemEvent,
	type CellLocator,
	type Grid,
	type GridCell,
	type GridId,
	type GridRow,
	type InstrumentHit
} from '$lib';
import { GridRepository } from '$lib/data/repository/grid_repository';
import type { OnEvent } from '$lib/domain/event';
import { buildDefaultGrid, defaultGridRow, generateGridId } from '$lib/domain/model/default_grid';
import { calculateMsPerBeatDivision } from '$lib/mapper/misc_mapper_funcs';
import type { RemoveGrid } from '$lib/ui/grid/grid_ui_events';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { GridRepositoryI } from '../interface/GridRepositoryI';

// Responsible for storing, and modifying grids
// TODO Split this monstrosity out into smaller chunks
export class GridStore implements GridRepositoryI {
	private onEvent: OnEvent;
	private gridRepository: GridRepository = new GridRepository();

	constructor(onEvent: OnEvent) {
		this.onEvent = onEvent;
	}

	private grids: SvelteMap<GridId, Grid> = new SvelteMap();
	private currentlyPlayingGrid: Grid | null = $state(null);
	private mostRecentlyPlayedGrid: Grid | null = $state(null);
	private currentlySelectedCells: CellLocator[] = $state([]);
	private selectedCellSet: Set<string> = new SvelteSet();
	private selectionStartCell: CellLocator | null = $state(null);
	private copiedCells: GridCell[] = [];
	// When we move or duplicate a grid, we should scroll to the grids new position
	public shouldScrollToGridId: GridId | null = $state(null);

	getCurrentlySelectedCells(): CellLocator[] {
		return this.currentlySelectedCells;
	}

	isCellSelected(locator: CellLocator): boolean {
		return this.selectedCellSet.has(`${locator.grid}:${locator.row}:${locator.cell}`);
	}

	// private updateSelectedCellSet() {
	// 	this.selectedCellSet.clear()
	// 	this.currentlySelectedCells.forEach((loc) => {
	// 		this.selectedCellSet.add(`${loc.grid}:${loc.row}:${loc.cell}`)
	// 	})
	// 	console.log("currentlySelectedCells updated", $state.snapshot(this.currentlySelectedCells), this.selectedCellSet);
	// }

	getGridsFromMostRecentlyPlayedGrid(): Grid[] {
		if (!this.mostRecentlyPlayedGrid) return [];
		return this.getGridsFromGridOnwards(this.mostRecentlyPlayedGrid);
	}

	getGridsFromCurrentlyPlaying(): Grid[] {
		if (!this.currentlyPlayingGrid) return [];
		return this.getGridsFromGridOnwards(this.currentlyPlayingGrid);
	}

	getGridsFromGridOnwards(grid: Grid): Grid[] {
		const gridsArray = Array.from(this.grids.values());
		const sortedGrids = gridsArray.sort((a, b) => a.index - b.index);
		const startIndex = sortedGrids.findIndex((g) => g.id === grid.id);

		if (startIndex === -1) return [];

		return sortedGrids.slice(startIndex);
	}

	getGrids(): Map<GridId, Grid> {
		return this.grids;
	}

	getGrid(gridId: GridId): Grid | null {
		return this.grids.get(gridId) ?? null;
	}

	getFirstGrid(): Grid | null {
		return this.grids.values().next().value ?? null;
	}

	getGridOfCurrentlySelectedCell(): Grid | null {
		const firstCurrentlySelectedCell = this.currentlySelectedCells[0];
		return firstCurrentlySelectedCell
			? (this.grids.get(firstCurrentlySelectedCell.grid) ?? null)
			: null;
	}

	stopPlayingGrid() {
		if (this.currentlyPlayingGrid != null) {
			this.currentlyPlayingGrid.playing = false;
			this.currentlyPlayingGrid = null;
		}
	}

	toggleToolsExpansion(id: string) {
		this.updateGrid(id, (grid) => (grid.toolsExpanded = !grid.toolsExpanded));
	}

	// TODO Extract this.shouldScrollToGridId and these two functions as a poc for splitting large stores
	getGridToScrollTo(): GridId | null {
		return this.shouldScrollToGridId;
	}

	onScrolledToGrid() {
		this.shouldScrollToGridId = null;
	}

	scrollToGrid(id: GridId) {
		this.shouldScrollToGridId = id;
	}

	async initialise(
		gridMap: Map<GridId, Grid>,
		instruments: Map<InstrumentId, InstrumentWithId>
	): Promise<SvelteMap<GridId, Grid>> {
		try {
			this.grids.clear();
			let grids = Array.from(gridMap.values());
			if (grids.length == 0) {
				console.log('No grids to initialise, adding default grid');
				await this.addDefaultGrid(instruments);
			} else {
				for (const grid of grids) {
					await this.addGrid(grid, false);
				}
			}
		} catch (e: any) {
			console.error('Error initialising grids:', e);
			this.onEvent({
				event: ProblemEvent.DatabaseError,
				doingWhat: 'initialising grids',
				error: e.target.error
			});
		}
		return this.grids;
	}

	setCurrentlySelectedCellHits(hits: InstrumentHit[]) {
		this.currentlySelectedCells.forEach((locator) => {
			if (this.currentlySelectedCells) {
				this.updateGridCell(locator, (cell) => {
					cell.hits = hits;
				});
			}
		});
	}

	// Adds a cell to the selection only if not already present
	addCellToSelection(locator: CellLocator) {
		const key = `${locator.grid}:${locator.row}:${locator.cell}`;
		if (!this.selectedCellSet.has(key)) {
			this.currentlySelectedCells.push(locator);
			this.selectedCellSet.add(key);
		}
	}

	// Sets the selection to a unique list of cells
	setCurrentlySelectedCells(locators: CellLocator[]) {
		this.currentlySelectedCells = [];
		this.selectedCellSet.clear();
		for (const locator of locators) {
			this.addCellToSelection(locator);
		}
		console.log('Currently selected cells updated:', $state.snapshot(this.currentlySelectedCells));
	}

	selectUpTo(locator: CellLocator) {
		if (!this.selectionStartCell) return;

		const anchor = this.selectionStartCell;
		const startCell = Math.min(anchor.cell, locator.cell);
		const endCell = Math.max(anchor.cell, locator.cell);

		const newSelection: CellLocator[] = [];
		for (let cell = startCell; cell <= endCell; cell++) {
			const cellLocator = { grid: anchor.grid, row: anchor.row, cell };
			newSelection.push(cellLocator);
		}
		this.setCurrentlySelectedCells(newSelection);
	}

	copyCurrentlySelectedCells() {
		this.copiedCells = [];
		this.currentlySelectedCells.forEach((locator) => {
			let cell = this.getCell(locator);
			if (cell) {
				this.copiedCells.push(cell);
			}
		});
		console.log('Copied cells', this.copiedCells);
	}

	// Paste the copied cells starting at the currently selected cell
	// If pasting to a different row / instrument, we see if there's a hit with a matching HitKey
	// Otherwise we default to pasting the first instrument hit
	pasteCells(instruments: Map<string, InstrumentWithId>) {
		// Find the instrument for the currently selected cell[0]
		const firstSelectedCell = this.currentlySelectedCells[0];
		let instrumentForPaste = this.grids.get(firstSelectedCell.grid)?.rows[firstSelectedCell.row]
			.instrument;
		if (instrumentForPaste == undefined) {
			console.error(
				"Can't paste as can't find instrument on first selected cell",
				firstSelectedCell
			);
			return;
		}
		let pastableHitTypes = [...instrumentForPaste.hitTypes.values()];
		console.log(
			'Pasting cells',
			this.copiedCells,
			'from',
			firstSelectedCell,
			'with available hit types',
			pastableHitTypes
		);

		// For each copiedCell, start at firstSelectedCell and paste the copied cell moving right
		this.copiedCells.forEach((copiedCell, index) => {
			let instrumentFromCopiedCell: InstrumentWithId | undefined = instruments.get(
				copiedCell.hits[0]?.instrumentId
			);

			let locator = { ...firstSelectedCell, cell: firstSelectedCell.cell + index };
			this.updateGridCell(locator, (cell) => {
				// If we're pasting a merged cell, we need to update the cells to the right to occupy 0 cells
				if (copiedCell.cells_occupied > 1) {
					// Update the next cells_occupied cells to occupy 0 cells
					for (let i = 1; i < copiedCell.cells_occupied; i++) {
						this.updateGridCell({ ...locator, cell: locator.cell + i }, (cell) => {
							cell.cells_occupied = 0;
						});
					}

					cell.cells_occupied = copiedCell.cells_occupied;
				}
				// Map the copied cell hits to the new instrument
				cell.hits = copiedCell.hits.map((copiedInstrumentHit) => {
					// Find the hit in 'pastableHitTypes' with the same key as 'instrumentForCopy' and set on newHit
					let copiedHit: HitTypeWithId | undefined = instrumentFromCopiedCell?.hitTypes.get(
						copiedInstrumentHit.hitId
					);
					let newInstrumentHit: HitTypeWithId | undefined = pastableHitTypes.find(
						(pastableHits) => pastableHits.key == copiedHit?.key
					);
					// Default to the first hit if we can't find a matching hit
					const newInstrumentHitId =
						newInstrumentHit?.id ?? [...instrumentForPaste.hitTypes.values()][0].id;
					return { hitId: newInstrumentHitId, instrumentId: instrumentForPaste.id };
				});
			});
		});
	}

	// Combined all actions to be complete when a cell is clicked:
	// - Toggle the hit
	// - Update the selected state
	onTapGridCell(locator: CellLocator) {
		this.selectionStartCell = locator;
		this.toggleGridHit(locator);
		this.setCurrentlySelectedCells([locator]);
	}

	// Like tapping, but only selects the cell. Doesn't update hit
	onStartCellSelection(locator: CellLocator) {
		this.selectionStartCell = locator;
		this.setCurrentlySelectedCells([locator]);
	}

	// Toggle the hit in the cell
	toggleGridHit(locator: CellLocator) {
		let row = this.grids.get(locator.grid)?.rows[locator.row];
		if (row) {
			let cell = this.getCell(locator);
			if (cell == undefined) return;
			let nextHit = this.nextHit(row, cell?.hits[0]?.hitId);
			let nextHits: InstrumentHit[];
			if (nextHit == undefined) {
				nextHits = [];
			} else if (cell.hits.length == 0) {
				nextHits = [nextHit];
			} else {
				nextHits = cell.hits.map((h) => nextHit);
			}
			this.updateGridCell(locator, (cell) => {
				cell.hits = nextHits;
			});
		} else {
			console.error(
				`Can't toggle grid cell hit as can't find the row. Locator: `,
				locator,
				', grids:',
				this.grids
			);
		}
	}

	// Returns the next cyclic hit type.
	// Clicking a cell cycles through all the available hit types
	// TODO Would maybe be better to use right clicking or long pressing or something
	nextHit(row: GridRow, hitId: HitId | undefined): InstrumentHit | undefined {
		let allInstrumentHits = Array.from(row.instrument.hitTypes.values());
		let instrumentHit = {
			instrumentId: row.instrument.id,
			hitId: allInstrumentHits[0].id
		};

		if (hitId == undefined) return instrumentHit;
		let currentIndex = allInstrumentHits.findIndex((hit) => {
			return hit.id == hitId;
		});
		if (currentIndex + 1 >= allInstrumentHits.length) {
			return undefined;
		} else {
			instrumentHit.hitId = allInstrumentHits[currentIndex + 1].id;
			return instrumentHit;
		}
	}

	resizeGrid(grid: Grid) {
		const { bars, beatsPerBar, beatDivisions } = grid.config;
		const expectedCells = bars * beatsPerBar * beatDivisions;

		grid.rows.forEach((row) => {
			const currentCellCount = row.cells.length;
			if (expectedCells < currentCellCount) {
				// Trim cell array
				row.cells.length = expectedCells;
			} else {
				const emptyCell: GridCell = {
					hits: [],
					cells_occupied: 1
				};
				const newCells: GridCell[] = new Array(expectedCells - currentCellCount).fill(emptyCell);
				row.cells.push(...newCells);
			}
		});
	}

	unMergeCurrentlySelectedCell() {
		this.currentlySelectedCells.forEach((locator) => {
			this.unMergeCells(locator);
		});
	}

	unMergeCells(locator: CellLocator) {
		this.updateGrid(locator.grid, (grid) => {
			console.log(`Unmerging cell`, $state.snapshot(locator.cell));

			let row = grid.rows[locator.row];
			let cell = row.cells[locator.cell];

			// If the cell is not merged, do nothing
			if (cell.cells_occupied <= 1) {
				console.warn('Cell is not merged, skipping unmerge.');
				return;
			}

			// Determine the starting index of the merged cells
			let startIndex = locator.cell;
			for (let i = locator.cell; i >= 0; i--) {
				if (row.cells[i].cells_occupied > 0) {
					startIndex = i;
					break;
				}
			}

			let mergedCell = row.cells[startIndex];
			let originalSize = mergedCell.cells_occupied;

			console.log('Splitting cell at index', startIndex, 'which spans', originalSize, 'cells');

			// Restore individual cells
			for (let i = 0; i < originalSize; i++) {
				row.cells[startIndex + i] = {
					hits: mergedCell.hits.length > 0 ? [mergedCell.hits[0]] : [],
					cells_occupied: 1
				};
			}

			console.log('Grid after unmerge', $state.snapshot(grid));
		});
		this.currentlySelectedCells = [];
	}

	mergeCurrentlySelectedCells() {
		if (this.currentlySelectedCells.length > 1) {
			console.log(`Merging cells`, $state.snapshot(this.currentlySelectedCells));

			// Sort selected cells by their position (assume same grid/row)
			const sorted = [...this.currentlySelectedCells].sort((a, b) => a.cell - b.cell);
			const first = sorted[0];
			const last = sorted[sorted.length - 1];

			// Get the grid
			this.updateGrid(first.grid, (grid) => {
				const row = grid.rows[first.row];
				if (!row) return;

				// Compute the full span to merge, accounting for merged cells in the selection
				let mergeStart = first.cell;
				let mergeEnd = last.cell;
				for (const locator of sorted) {
					const cell = row.cells[locator.cell];
					if (cell && cell.cells_occupied > 1) {
						// Expand mergeStart/mergeEnd if merged cell extends beyond selection
						const mergedStart = locator.cell;
						const mergedEnd = locator.cell + cell.cells_occupied - 1;
						if (mergedStart < mergeStart) mergeStart = mergedStart;
						if (mergedEnd > mergeEnd) mergeEnd = mergedEnd;
					}
				}
				const numCells = mergeEnd - mergeStart + 1;

				// Set the first cell in the merged span to occupy the merged span
				row.cells[mergeStart] = {
					hits: [],
					cells_occupied: numCells
				};

				// Set the rest of the merged cells to cells_occupied: 0
				for (let i = mergeStart + 1; i <= mergeEnd; i++) {
					row.cells[i] = {
						hits: [],
						cells_occupied: 0
					};
				}

				// Keep only the merged-into cell selected
				this.setCurrentlySelectedCells([first]);
			});
		} else {
			console.error("Can't merge < 1 cell. Currently selected cells", this.currentlySelectedCells);
		}
	}

	// When instruments are added / removed, we need to remove the rows for the
	// deleted ones, and add rows for the new ones
	async syncInstruments(instruments: Map<InstrumentId, InstrumentWithId>) {
		await this.updateGrids((grid) => {
			// First remove all rows where the instrument is removed
			let filteredRows = grid.rows.filter((row) => {
				return instruments.has(row.instrument.id);
			});
			// Now replace existing instruments in case hits have changed
			filteredRows.forEach((row) => {
				row.instrument = instruments.get(row.instrument.id) ?? row.instrument;
			});
			// Now add missing instrument row, assuming only one can be added at a time
			if (filteredRows.length < instruments.size) {
				// Assuming instrument always added to end of list
				let instrument = [...instruments.values()].pop();
				if (instrument) {
					filteredRows.push(
						defaultGridRow(
							instrument,
							grid.config.bars,
							grid.config.beatsPerBar,
							grid.config.beatDivisions
						)
					);
				}
			}
			grid.rows = filteredRows;
		});
	}

	async addDefaultGrid(instruments: Map<InstrumentId, InstrumentWithId>) {
		const index = this.getNextGridIndex();
		let grid: Grid = buildDefaultGrid(instruments, index);
		this.addGrid(grid);
	}

	async duplicateGrid(id: GridId) {
		let gridToDuplicate = this.grids.get(id);
		if (gridToDuplicate) {
			let newGrid = $state.snapshot(gridToDuplicate);
			newGrid.index = this.getNextGridIndex();
			newGrid.id = generateGridId();
			newGrid.config.name = newGrid.config.name + ' (copy)';
			newGrid.playing = false;
			await this.addGrid(newGrid);
			this.shouldScrollToGridId = newGrid.id;
		}
	}

	getCell(locator: CellLocator): GridCell | undefined {
		let grid = this.grids.get(locator.grid);
		return grid ? grid.rows[locator.row]?.cells[locator.cell] : undefined;
	}

	getHitAt(locator: CellLocator): InstrumentHit | undefined {
		return this.getCell(locator)?.hits[0];
	}

	getNextGridIndex(): number {
		let indexes = [...this.grids.values()].map((grid) => grid.index).filter((i) => i >= 0);
		return Math.max(...indexes, -1) + 1;
	}

	// Makes the grid reactive, and sets it in state and the DB
	async addGrid(grid: Grid, persist: boolean = true) {
		let reactiveGrid = $state(grid);
		this.grids.set(reactiveGrid.id, reactiveGrid);
		if (persist) {
			await this.trySaveGrid(grid);
		}
	}

	updateRepetitions(gridId: string, repetitions: number) {
		this.updateGrid(gridId, (grid: Grid) => {
			grid.config.repetitions = repetitions;
		});
	}

	updateBpm(gridId: GridId, bpm: number) {
		this.updateGrid(gridId, (grid: Grid) => {
			grid.config.bpm = bpm;
			grid.msPerBeatDivision = calculateMsPerBeatDivision(bpm, grid.config.beatDivisions);
		});
	}

	updateSize(gridId: GridId, beats_per_bar: number, beat_divisions: number) {
		this.updateGrid(gridId, (grid: Grid) => {
			grid.config.beatsPerBar = beats_per_bar;
			grid.config.beatDivisions = beat_divisions;
			this.resizeGrid(grid);
			grid.gridCols = this.notationColumns(grid);
			grid.msPerBeatDivision = calculateMsPerBeatDivision(
				grid.config.bpm,
				grid.config.beatDivisions
			);
		});
	}

	updateName(gridId: GridId, name: string) {
		this.updateGrid(gridId, (grid) => {
			grid.config.name = name;
		});
	}

	updateBars(gridId: GridId, bars: number) {
		this.updateGrid(gridId, (grid: Grid) => {
			grid.config.bars = bars;
			this.resizeGrid(grid);
			grid.gridCols = this.notationColumns(grid);
		});
	}

	async updatePlaying(playing: boolean, gridId: string) {
		// Set existing currently playing grid to false all the time
		if (this.currentlyPlayingGrid) {
			this.currentlyPlayingGrid.playing = false;
		}
		// Set new currently playing grid, and most recently played grid state
		if (playing) {
			this.currentlyPlayingGrid = this.grids.get(gridId) ?? null;
			this.mostRecentlyPlayedGrid = this.currentlyPlayingGrid;
		} else {
			this.currentlyPlayingGrid = null;
		}
		// Update the grid in state, but not the db
		await this.updateGrid(
			gridId,
			(grid) => {
				grid.playing = playing;
			},
			false
		);
	}

	// Updates grids in state and DB
	async updateGrids(withGrid: (grid: Grid) => void) {
		for (const grid of this.grids.values()) {
			withGrid(grid);
			await this.trySaveGrid(grid);
		}
	}

	// Updates grid in state and DB
	async updateGrid(id: GridId, withGrid: (grid: Grid) => void, persist: boolean = true) {
		let grid = this.grids.get(id);
		if (grid) {
			withGrid(grid);
			if (persist) await this.trySaveGrid(grid);
		} else {
			console.error("Couldn't find grid to update with id ", id);
		}
	}

	// Updates grid cell in state and DB
	updateGridCell(
		locator: CellLocator,
		withGridCell: (division: GridCell) => void,
		persist: boolean = true
	) {
		this.updateGrid(
			locator.grid,
			(grid) => {
				let cell = grid.rows[locator.row].cells[locator.cell];
				if (cell) {
					withGridCell(cell);
				} else {
					console.error("Couldn't find grid cell to update with locator ", locator);
				}
			},
			persist
		);
	}

	async trySaveGrid(grid: Grid) {
		await this.gridRepository.saveGrid(grid).catch((e) => {
			console.error('Error saving grid', e, grid);
			let error = e.target.error;
			this.onEvent({
				event: ProblemEvent.DatabaseError,
				doingWhat: 'saving grid to database',
				error
			});
		});
	}

	async replaceGrids(grids: Grid[], persist: boolean) {
		this.resetState();
		console.log('Replacing grids with', grids);
		this.grids.clear();
		for (const grid of grids) {
			await this.addGrid(grid, persist);
		}
	}

	async removeGrid(event: RemoveGrid) {
		this.grids.delete(event.gridId);
		await this.gridRepository.deleteGrid(event.gridId);
		this.resetState(); // Easier to reset than check a bunch of stuff
	}

	// TODO Could probably merge the logic with moveInstrument
	async moveGrid(direction: 'up' | 'down', gridId: GridId) {
		let movingGrid = this.grids.get(gridId);
		if (!movingGrid) {
			console.warn(`Couldn't move grid ${direction} as no grid with id found`, gridId);
			return;
		}
		let movingIndex = movingGrid.index;

		let swappingIndex;
		if (direction === 'down') {
			swappingIndex = movingIndex + 1;
		} else if (direction === 'up') {
			swappingIndex = movingIndex - 1;
		} else {
			console.error(`Unexpected code path`);
			return;
		}
		let swappingGrid = [...this.grids.values()].find((i) => i.index == swappingIndex);
		if (!swappingGrid) {
			console.warn(
				`Couldn't move grid ${direction} as no grid with index ${swappingIndex} found in grids`,
				$state.snapshot(this.grids)
			);
			return;
		}
		await this.updateGrid(movingGrid.id, (i) => {
			i.index = swappingIndex;
		});
		await this.updateGrid(swappingGrid.id, (i) => {
			i.index = movingIndex;
		});
		this.shouldScrollToGridId = movingGrid.id;
	}

	async reset() {
		await this.gridRepository.deleteAllGrids();
		this.resetState();
	}

	resetState() {
		this.currentlyPlayingGrid = null;
		this.mostRecentlyPlayedGrid = null;
		this.currentlySelectedCells = [];
		this.selectedCellSet.clear();
		this.selectionStartCell = null;
		this.copiedCells = [];
	}

	// Returns a count of the number of columns in the grid
	// Used to decide when to resize the grid
	private notationColumns(grid: Grid): number {
		return grid.config.bars * (grid.config.beatsPerBar * grid.config.beatDivisions);
	}
}
