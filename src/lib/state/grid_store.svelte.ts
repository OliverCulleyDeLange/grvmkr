import { calculateMsPerBeatDivision } from "$lib/mapper/misc_mapper_funcs";
import { buildDefaultGrid, defaultGridRow } from "$lib/model/default_grid";
import { mapSavedGridV1ToGrid } from "$lib/serialisation/from_save_file_v1";
import { mapSavedGridV2ToGrid } from "$lib/serialisation/from_save_file_v2";
import { mapSavedGridV3ToGrid } from "$lib/serialisation/from_save_file_v3";
import { GridService } from "$lib/service/grid_service";
import { DomainEvent } from "$lib/types/domain/event";
import type { CellLocator, Grid, GridCell, GridId, GridRow, InstrumentHit } from "$lib/types/domain/grid_domain";
import type { HitId, InstrumentId, InstrumentWithId } from "$lib/types/domain/instrument_domain";
import type { SaveFileV1 } from "$lib/types/serialisation/savefile_v1";
import type { SaveFileV2 } from "$lib/types/serialisation/savefile_v2";
import type { SaveFileV3 } from "$lib/types/serialisation/savefile_v3";
import type { RemoveGrid } from "$lib/types/ui/grid_ui";
import { SvelteMap } from "svelte/reactivity";
import type { InstrumentStore } from "./instrument_store.svelte";
import type { OnEvent } from "$lib/types/event";

// Responsible for storing, and modifying grids
export class GridStore {
    private onEvent: OnEvent
    private gridService: GridService

    constructor(instrumentStore: InstrumentStore, onEvent: OnEvent) {
        this.gridService = new GridService(instrumentStore)
        this.onEvent = onEvent
    }

    public grids: SvelteMap<GridId, Grid> = new SvelteMap();
    public currentlyPlayingGrid: Grid | undefined = $state();
    public currentlySelectedCell: CellLocator | undefined = $state();

    async initialise(instruments: Map<InstrumentId, InstrumentWithId>) {
        try {
            let grids = await this.gridService.getAllGrids()
            if (grids.length == 0) {
                this.addDefaultGrid(instruments)
            } else {
                grids.forEach((grid) => this.addGrid(grid))
            }
        } catch (e: any) {
            console.error("Error getting all grids:", e)
            this.onEvent({
                event: DomainEvent.DatabaseError,
                doingWhat: "initialising grids",
                error: e.target.error
            })
            this.addDefaultGrid(instruments)
        }
    }

    setCurrentlySelectedCellHits(hits: InstrumentHit[]) {
        if (this.currentlySelectedCell) {
            this.updateGridCell(this.currentlySelectedCell, (cell) => {
                cell.hits = hits
            })
        }
    }

    // Combined all actions to be complete when a cell is clicked:
    // - Toggle the hit
    // - Play the new hit
    // - Update the selected state
    // - Update cell tools
    onTapGridCell(locator: CellLocator) {
        this.toggleGridHit(locator);
        if (this.currentlySelectedCell) {
            this.updateGridCell(this.currentlySelectedCell, (cell) => {
                cell.selected = false
            })
        }
        this.updateGridCell(locator, (cell) => {
            cell.selected = true
        })
        this.currentlySelectedCell = locator
    }

    // Toggle the hit in the cell 
    toggleGridHit(locator: CellLocator) {
        let row = this.grids.get(locator.grid)?.rows[locator.row];
        if (row) {
            let cell = this.getCell(locator);
            if (cell == undefined) return
            let nextHit = this.nextHit(row, cell?.hits[0]?.hitId);
            let nextHits: InstrumentHit[];
            if (nextHit == undefined) {
                nextHits = []
            }
            else if (cell.hits.length == 0) {
                nextHits = [nextHit]
            } else {
                nextHits = cell.hits.map((h) => nextHit)
            }
            // console.log(`Tapped location ${JSON.stringify(locator)} ${currentValue} -> ${newInstrumentHit}`);
            this.updateGridCell(locator, (cell) => {
                cell.hits = nextHits
            })
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
        const expectedCells = bars * beatsPerBar * beatDivisions

        grid.rows.forEach((row) => {
            const currentCellCount = row.cells.length
            if (expectedCells < currentCellCount) {
                // Trim cell array
                row.cells.length = expectedCells
            } else {
                const emptyCell: GridCell = {
                    hits: [],
                    cells_occupied: 1,
                    selected: false
                }
                const newCells: GridCell[] = new Array(expectedCells - currentCellCount).fill(emptyCell)
                row.cells.push(...newCells)
            }
        });
    }

    unMergeCurrentlySelectedCell() {
        if (this.currentlySelectedCell) {
            this.unMergeCells(this.currentlySelectedCell)
        }
    }

    unMergeCells(locator: CellLocator) {
        this.updateGrid(locator.grid, (grid) => {
            console.log(`Unmerging cell`, $state.snapshot(locator.cell));

            let row = grid.rows[locator.row];
            let cell = row.cells[locator.cell];

            // If the cell is not merged, do nothing
            if (cell.cells_occupied <= 1) {
                console.warn("Cell is not merged, skipping unmerge.");
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

            console.log("Splitting cell at index", startIndex, "which spans", originalSize, "cells");

            // Restore individual cells
            for (let i = 0; i < originalSize; i++) {
                row.cells[startIndex + i] = {
                    hits: mergedCell.hits.length > 0 ? [mergedCell.hits[0]] : [],
                    cells_occupied: 1,
                    selected: false
                };
            }

            console.log("Grid after unmerge", $state.snapshot(grid));
        });
        this.currentlySelectedCell = undefined
    }

    mergeCurrentlySelectedCell(side: "left" | "right") {
        if (this.currentlySelectedCell) {
            this.mergeCells(this.currentlySelectedCell, side)
        }
    }

    mergeCells(locator: CellLocator, side: "left" | "right") {
        this.updateGrid(locator.grid, (grid) => {
            console.log(`Merging grid cell ${side} of cell`, $state.snapshot(locator.cell))
            let clickedCell = grid.rows[locator.row].cells[locator.cell]
            let cellIndexAddition: number
            if (side == "left") { cellIndexAddition = -1 } else { cellIndexAddition = 1 }
            // We have to find the next cell which hasn't already been merged to the left or right
            let cellNextToClickedCell: GridCell | undefined
            let cellNextToClickedCellIndex: number = locator.cell
            for (let i = locator.cell + cellIndexAddition; i >= 0 || i < grid.rows[locator.row].cells.length; i += cellIndexAddition) {
                console.log("Getting cell ", i)
                let cell = grid.rows[locator.row].cells[i]
                if (cell.cells_occupied > 0) {
                    cellNextToClickedCell = cell
                    cellNextToClickedCellIndex = i
                    break
                }
            }

            if (clickedCell && cellNextToClickedCell && clickedCell != cellNextToClickedCell) {
                console.log("Cells to merge", $state.snapshot(clickedCell), " & ", $state.snapshot(cellNextToClickedCell))
                // Update the left most cell with the cell occupation
                const cellToExtend = (side === "left") ? cellNextToClickedCell : clickedCell;
                const cellToEmpty = (side === "left") ? clickedCell : cellNextToClickedCell;

                // Extend cell
                cellToExtend.cells_occupied += cellToEmpty.cells_occupied;
                cellToExtend.selected = cellToEmpty.selected || cellToExtend.selected
                cellToExtend.hits = []
                // Empty cell
                cellToEmpty.cells_occupied = 0;
                cellToEmpty.hits = [];
                cellToEmpty.selected = false
                // Update currently selected cell. if we merge left we should select the cell we merged into
                if (side == "left") {
                    this.currentlySelectedCell = { ...locator, cell: cellNextToClickedCellIndex }
                }
                console.log("Cells after merge", $state.snapshot(clickedCell), " & ", $state.snapshot(cellNextToClickedCell))
                console.log("Grid after merge", $state.snapshot(grid))
            } else {
                console.error(`Couldn't find grid cells to merge. Index ${$state.snapshot(locator.cell)} gave cell`,
                    $state.snapshot(clickedCell),
                    `, with cel to the ${side} `,
                    $state.snapshot(cellNextToClickedCell),
                    ", grid:",
                    $state.snapshot(grid)
                );
            }
        })
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
                    filteredRows.push(defaultGridRow(instrument, grid.config.bars, grid.config.beatsPerBar, grid.config.beatDivisions));
                }
            }
            // console.log("Filtered rows +", filteredRows)
            grid.rows = filteredRows;
        });
    }

    async loadSaveFileV1(saveFile: SaveFileV1, instrumentStore: InstrumentStore) {
        this.gridService.deleteAllGrids()
        this.grids.clear();
        saveFile.grids.forEach((grid) => {
            let gridModel: Grid = mapSavedGridV1ToGrid(grid, instrumentStore);
            this.addGrid(gridModel)
        });
    }

    async loadSaveFileV2(saveFile: SaveFileV2, instrumentStore: InstrumentStore) {
        this.gridService.deleteAllGrids()
        this.grids.clear();
        saveFile.grids.forEach((grid) => {
            let gridModel: Grid = mapSavedGridV2ToGrid(grid, instrumentStore);
            this.addGrid(gridModel)
        });
    }

    async loadSaveFileV3(saveFile: SaveFileV3, instrumentStore: InstrumentStore) {
        this.gridService.deleteAllGrids()
        this.grids.clear();
        saveFile.grids.forEach((grid) => {
            let gridModel: Grid = mapSavedGridV3ToGrid(grid, instrumentStore);
            this.addGrid(gridModel)
        });
    }

    addDefaultGrid(instruments: Map<InstrumentId, InstrumentWithId>) {
        const index = this.getNextGridIndex()
        let grid: Grid = $state(buildDefaultGrid(instruments, index));
        this.addGrid(grid)
    }

    getCell(locator: CellLocator): GridCell | undefined {
        let grid = this.grids.get(locator.grid)
        return grid ? grid.rows[locator.row]?.cells[locator.cell] : undefined
    }

    getHitAt(locator: CellLocator): InstrumentHit | undefined {
        return this.getCell(locator)?.hits[0]
    }

    getNextGridIndex(): number {
        let indexes = [...this.grids.values()].map((grid) => grid.index).filter((i) => i >= 0)
        return Math.max(...indexes, -1) + 1
    }

    // Makes the grid reactive, and sets it in state and the DB
    addGrid(grid: Grid) {
        let reactiveGrid = $state(grid);
        this.grids.set(reactiveGrid.id, reactiveGrid);
        this.trySaveGrid(grid);
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
            grid.msPerBeatDivision = calculateMsPerBeatDivision(grid.config.bpm, grid.config.beatDivisions);
        });
    }

    updateName(gridId: GridId, name: string) {
        this.updateGrid(gridId, (grid) => {
            grid.config.name = name
        })
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
        } else {
            this.currentlyPlayingGrid = undefined;
        }
        this.updateGrid(gridId, (grid) => {
            grid.playing = playing;
        }, false);
    }

    // Updates grids in state and DB
    updateGrids(withGrid: (grid: Grid) => void) {
        this.grids.forEach((grid) => {
            withGrid(grid)
            this.trySaveGrid(grid)
        })
    }

    // Updates grid in state and DB
    updateGrid(id: GridId, withGrid: (grid: Grid) => void, persist: boolean = true) {
        let grid = this.grids.get(id);
        if (grid) {
            withGrid(grid);
            if (persist) this.trySaveGrid(grid)
        } else {
            console.error("Couldn't find grid to update with id ", id);
        }
    }

    // Updates grid cell in state and DB
    updateGridCell(locator: CellLocator, withGridCell: (division: GridCell) => void) {
        this.updateGrid(locator.grid, (grid) => {
            let cell = grid.rows[locator.row].cells[locator.cell]
            if (cell) {
                withGridCell(cell)
            } else {
                console.error("Couldn't find grid cell to update with locator ", locator);
            }
        })
    }

    trySaveGrid(grid: Grid) {
        console.log("Saving grid to db", $state.snapshot(grid))
        this.gridService.saveGrid(grid)
            .catch((e) => {
                console.error("Error saving grid", e, grid)
                let error = e.target.error
                this.onEvent({
                    event: DomainEvent.DatabaseError,
                    doingWhat: "saving grid",
                    error
                })
            });
    }

    removeGrid(event: RemoveGrid) {
        this.grids.delete(event.gridId);
        this.gridService.deleteGrid(event.gridId)
    }

    // Returns a count of the number of columns in the grid
    // Used to decide when to resize the grid
    private notationColumns(grid: Grid): number {
        return grid.config.bars * (grid.config.beatsPerBar * grid.config.beatDivisions)
    }
}
