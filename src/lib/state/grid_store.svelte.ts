import { calculateMsPerBeatDivision } from '$lib/mapper/misc_mapper_funcs';
import { buildDefaultGrid, defaultGridRow } from '$lib/model/default_grid';
import { GridRepository } from '$lib/repository/grid_repository';
import { mapSavedGridV1ToGrid } from '$lib/serialisation/from_save_file_v1';
import { mapSavedGridV2ToGrid } from '$lib/serialisation/from_save_file_v2';
import { mapSavedGridV3ToGrid } from '$lib/serialisation/from_save_file_v3';
import { DomainEvent } from '$lib/types/domain/event';
import type {
	CellLocator,
	Grid,
	GridCell,
	GridId,
	GridRow,
	InstrumentHit
} from '$lib/types/domain/grid_domain';
import type {
	HitId,
	HitTypeWithId,
	InstrumentId,
	InstrumentWithId
} from '$lib/types/domain/instrument_domain';
import type { OnEvent } from '$lib/types/event';
import type { SaveFileV1 } from '$lib/types/serialisation/savefile_v1';
import type { SaveFileV2 } from '$lib/types/serialisation/savefile_v2';
import type { SavedGridV3 } from '$lib/types/serialisation/savefile_v3';
import type { RemoveGrid } from '$lib/types/ui/grid_ui';
import { SvelteMap } from 'svelte/reactivity';
import type { InstrumentStore } from './instrument_store.svelte';

// Responsible for storing, and modifying grids
export class GridStore {
	private onEvent: OnEvent;
	private gridRepository: GridRepository = new GridRepository();

	constructor(onEvent: OnEvent) {
		this.onEvent = onEvent;
	}

	public grids: SvelteMap<GridId, Grid> = new SvelteMap();
	public currentlyPlayingGrid: Grid | undefined = $state();
	public mostRecentlyPlayedGrid: Grid | undefined = $state();
	public currentlySelectedCells: CellLocator[] = $state([]);
	public selectionStartCell: CellLocator | null = $state(null);
	public copiedCells: GridCell[] = [];

	async initialise(
		gridMap: Map<GridId, Grid>,
		instruments: Map<InstrumentId, InstrumentWithId>
	): Promise<SvelteMap<GridId, Grid>> {
		try {
			this.grids.clear();
			let grids = Array.from(gridMap.values());
			if (grids.length == 0) {
				console.log('No grids found, adding default grid');
				await this.addDefaultGrid(instruments);
			} else {
				for (const grid of grids) {
					await this.addGrid(grid, false);
				}
			}
		} catch (e: any) {
			console.error('Error getting all grids:', e);
			this.onEvent({
				event: DomainEvent.DatabaseError,
				doingWhat: 'initialising grids',
				error: e.target.error
			});
			await this.addDefaultGrid(instruments);
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

	selectUpTo(locator: CellLocator) {
		if (!this.selectionStartCell) return;

		const anchor = this.selectionStartCell;

		const startCell = Math.min(anchor.cell, locator.cell);
		const endCell = Math.max(anchor.cell, locator.cell);

		this.resetSelected();

		for (let cell = startCell; cell <= endCell; cell++) {
			const cellLocator = { grid: anchor.grid, row: anchor.row, cell };
			this.updateGridCell(cellLocator, (c) => (c.selected = true), false);
			this.currentlySelectedCells.push(cellLocator);
		}
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
	pasteCells(instruments: SvelteMap<string, InstrumentWithId>) {
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

	// Set 'selected' in all grid cells to false
	resetSelected() {
		this.grids.forEach((grid) => {
			grid.rows.forEach((row) => {
				row.cells.forEach((cell) => {
					cell.selected = false;
				});
			});
		});
		this.currentlySelectedCells = [];
	}

	// Combined all actions to be complete when a cell is clicked:
	// - Toggle the hit
	// - Update the selected state
	onTapGridCell(locator: CellLocator) {
		this.resetSelected();
		this.toggleGridHit(locator);
		this.updateGridCell(locator, (cell) => {
			cell.selected = true;
		});
		this.currentlySelectedCells = [locator];
	}

	// Like tapping, but only selects the cell. Doesn't update hit
	onStartCellSelection(locator: CellLocator) {
		this.resetSelected();
		this.updateGridCell(
			locator,
			(cell) => {
				cell.selected = true;
			},
			false
		);
		this.currentlySelectedCells = [locator];
		this.selectionStartCell = locator;
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
			// console.log(`Tapped location ${JSON.stringify(locator)} ${currentValue} -> ${newInstrumentHit}`);
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
					cells_occupied: 1,
					selected: false
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
					cells_occupied: 1,
					selected: false
				};
			}

			console.log('Grid after unmerge', $state.snapshot(grid));
		});
		this.currentlySelectedCells = [];
	}

	mergeCurrentlySelectedCell(side: 'left' | 'right') {
		if (this.currentlySelectedCells.length == 1) {
			this.mergeCells(this.currentlySelectedCells[0], side);
		} else {
			console.error(
				"Can't merge multiple cells. Currently selected cells",
				this.currentlySelectedCells
			);
		}
	}

	mergeCells(locator: CellLocator, side: 'left' | 'right') {
		this.updateGrid(locator.grid, (grid) => {
			console.log(`Merging grid cell ${side} of cell`, $state.snapshot(locator.cell));
			let clickedCell = grid.rows[locator.row].cells[locator.cell];
			let cellIndexAddition: number;
			if (side == 'left') {
				cellIndexAddition = -1;
			} else {
				cellIndexAddition = 1;
			}
			// We have to find the next cell which hasn't already been merged to the left or right
			let cellNextToClickedCell: GridCell | undefined;
			let cellNextToClickedCellIndex: number = locator.cell;
			for (
				let i = locator.cell + cellIndexAddition;
				i >= 0 || i < grid.rows[locator.row].cells.length;
				i += cellIndexAddition
			) {
				console.log('Getting cell ', i);
				let cell = grid.rows[locator.row].cells[i];
				if (cell.cells_occupied > 0) {
					cellNextToClickedCell = cell;
					cellNextToClickedCellIndex = i;
					break;
				}
			}

			if (clickedCell && cellNextToClickedCell && clickedCell != cellNextToClickedCell) {
				console.log(
					'Cells to merge',
					$state.snapshot(clickedCell),
					' & ',
					$state.snapshot(cellNextToClickedCell)
				);
				// Update the left most cell with the cell occupation
				const cellToExtend = side === 'left' ? cellNextToClickedCell : clickedCell;
				const cellToEmpty = side === 'left' ? clickedCell : cellNextToClickedCell;

				// Extend cell
				cellToExtend.cells_occupied += cellToEmpty.cells_occupied;
				cellToExtend.selected = cellToEmpty.selected || cellToExtend.selected;
				cellToExtend.hits = [];
				// Empty cell
				cellToEmpty.cells_occupied = 0;
				cellToEmpty.hits = [];
				cellToEmpty.selected = false;
				// Update currently selected cell. if we merge left we should select the cell we merged into
				if (side == 'left') {
					this.currentlySelectedCells = [{ ...locator, cell: cellNextToClickedCellIndex }];
				}
				console.log(
					'Cells after merge',
					$state.snapshot(clickedCell),
					' & ',
					$state.snapshot(cellNextToClickedCell)
				);
				console.log('Grid after merge', $state.snapshot(grid));
			} else {
				console.error(
					`Couldn't find grid cells to merge. Index ${$state.snapshot(locator.cell)} gave cell`,
					$state.snapshot(clickedCell),
					`, with cel to the ${side} `,
					$state.snapshot(cellNextToClickedCell),
					', grid:',
					$state.snapshot(grid)
				);
			}
		});
	}

	// When instruments are added / removed, we need to remove the rows for the
	// deleted ones, and add rows for the new ones
	syncInstruments(instruments: Map<InstrumentId, InstrumentWithId>) {
		this.updateGrids((grid) => {
			// First remove all rows where the instrument is removed
			let filteredRows = grid.rows.filter((row) => {
				return instruments.has(row.instrument.id);
			});
			// console.log("Filtered rows -", filteredRows)
			// Now add any new instruments
			if (filteredRows.length < instruments.size) {
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
			// console.log("Filtered rows +", filteredRows)
			grid.rows = filteredRows;
		});
	}

	async loadSaveFileV1(saveFile: SaveFileV1, instrumentStore: InstrumentStore) {
		this.grids.clear();
		saveFile.grids.forEach((grid) => {
			let gridModel: Grid = mapSavedGridV1ToGrid(grid, instrumentStore);
			this.addGrid(gridModel);
		});
	}

	async loadSaveFileV2(saveFile: SaveFileV2, instrumentStore: InstrumentStore) {
		this.grids.clear();
		saveFile.grids.forEach((grid) => {
			let gridModel: Grid = mapSavedGridV2ToGrid(grid, instrumentStore);
			this.addGrid(gridModel);
		});
	}

	async loadSaveFileV3(grids: SavedGridV3[], instrumentStore: InstrumentStore) {
		this.grids.clear();
		for (const grid of grids) {
			let gridModel: Grid = mapSavedGridV3ToGrid(grid, instrumentStore);
			await this.addGrid(gridModel);
		}
	}

	async addDefaultGrid(instruments: Map<InstrumentId, InstrumentWithId>) {
		const index = this.getNextGridIndex();
		//TODO I think this $state can be removed as its being added in addGrid
		let grid: Grid = $state(buildDefaultGrid(instruments, index));
		this.addGrid(grid);
	}

	duplicateGrid() {
		let lastGrid = [...this.grids.values()].pop();
		if (lastGrid) {
			console.log(lastGrid);
			let newGrid = $state.snapshot(lastGrid);
			newGrid.index = this.getNextGridIndex();
			newGrid.id = `grid_${crypto.randomUUID()}`;
			newGrid.config.name = newGrid.config.name + ' (copy)';
			this.addGrid(newGrid);
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

	updatePlaying(playing: boolean, gridId: string) {
		if (this.currentlyPlayingGrid) {
			this.currentlyPlayingGrid.playing = false;
		}
		if (playing) {
			this.currentlyPlayingGrid = this.grids.get(gridId);
			this.mostRecentlyPlayedGrid = this.currentlyPlayingGrid;
		} else {
			this.currentlyPlayingGrid = undefined;
		}
		this.updateGrid(
			gridId,
			(grid) => {
				grid.playing = playing;
			},
			false
		);
	}

	// Updates grids in state and DB
	updateGrids(withGrid: (grid: Grid) => void) {
		this.grids.forEach((grid) => {
			withGrid(grid);
			this.trySaveGrid(grid);
		});
	}

	// Updates grid in state and DB
	updateGrid(id: GridId, withGrid: (grid: Grid) => void, persist: boolean = true) {
		let grid = this.grids.get(id);
		if (grid) {
			withGrid(grid);
			if (persist) this.trySaveGrid(grid);
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
				event: DomainEvent.DatabaseError,
				doingWhat: 'saving grid to database',
				error
			});
		});
	}

	async replaceGrids(grids: Map<string, Grid>) {
		this.resetState();
		console.log('Replacing grids with', grids);
		this.grids.clear();
		for (const [id, grid] of grids) {
			await this.addGrid(grid, false);
		}
	}

	async removeGrid(event: RemoveGrid) {
		this.grids.delete(event.gridId);
		await this.gridRepository.deleteGrid(event.gridId);
		this.resetState(); // Easier to reset than check a bunch of stuff
	}

	async reset() {
		await this.gridRepository.deleteAllGrids();
		this.resetState();
	}

	resetState() {
		this.currentlyPlayingGrid = undefined;
		this.mostRecentlyPlayedGrid = undefined;
		this.currentlySelectedCells = [];
		this.selectionStartCell = null;
		this.copiedCells = [];
	}

	// Returns a count of the number of columns in the grid
	// Used to decide when to resize the grid
	private notationColumns(grid: Grid): number {
		return grid.config.bars * (grid.config.beatsPerBar * grid.config.beatDivisions);
	}
}
