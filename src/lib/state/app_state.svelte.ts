import { buildDefaultGrid, calculateMsPerBeatDivision, ContextMenuEvent, defaultFile, defaultGridRow, GridEvent, InstrumentManager, mapSavedGridV1ToGrid, mapSavedGridV2ToGrid, mapSavedGridV3ToGrid, serialiseToSaveFileV3, ToolbarEvent, UiEvent, type AppError, type CellLocator, type ContextMenu, type ErrorId, type Grid, type GridCell, type GridId, type GridRow, type GrvMkrFile, type HitId, type InstrumentHit, type RemoveGrid, type RightClick, type SaveFile, type SaveFileV1, type SaveFileV2, type SaveFileV3 } from "$lib";
import { defaultInstrumentConfig } from "$lib/audio/default_instruments";
import { FileService } from "$lib/service/file_service";
import { GridService } from "$lib/service/grid_service";
import { DomainEvent } from "$lib/types/domain/event";
import type { AppEvent } from "$lib/types/event";
import { InstrumentEvent } from "$lib/types/ui/instruments";
import { SvelteMap } from "svelte/reactivity";

export class AppStateStore {
    // TODO make private
    public instrumentManager: InstrumentManager = new InstrumentManager();
    private gridService: GridService = new GridService(this.instrumentManager)
    private fileService: FileService = new FileService(this.instrumentManager)
    private playingIntervalId: number | undefined = undefined;
    private nextCount: number = 0;

    // Main state
    public file: GrvMkrFile = $state(defaultFile)
    public contextMenu: ContextMenu | undefined = $state()
    public grids: SvelteMap<GridId, Grid> = new SvelteMap();
    public currentlyPlayingGrid: Grid | undefined = $state();
    public errors: SvelteMap<ErrorId, AppError> = new SvelteMap();

    // Derived state
    public msPerBeatDivision = $derived(this.currentlyPlayingGrid?.msPerBeatDivision);

    onEvent(event: AppEvent) {
        this.logEvent(event)
        switch (event.event) {
            case UiEvent.Mounted:
                this.initialise();
                break;
            case ContextMenuEvent.Dismiss:
                this.contextMenu = undefined
                break;
            case ContextMenuEvent.MergeCells:
                this.mergeCells(event.locator, event.side)
                break;
            case ContextMenuEvent.UnMerge:
                this.unMergeCells(event.locator)
                break;
            case ToolbarEvent.FileNameChanged:
                this.updateFile((file) => { file.name = event.fileName })
                break;
            case GridEvent.TogglePlaying:
                this.onTogglePlaying(event.playing, event.gridId);
                break;
            case GridEvent.ToggleGridHit:
                this.toggleGridHit(event.locator);
                break;
            case GridEvent.RightClick:
                this.showContextMenu(event)
                break;
            case GridEvent.RemoveGrid:
                this.removeGrid(event);
                break;
            case GridEvent.AddGrid:
                this.addDefaultGrid()
                break;
            case GridEvent.BpmChanged:
                this.updateGrid(event.gridId, (grid: Grid) => {
                    grid.config.bpm = event.bpm;
                    grid.msPerBeatDivision = calculateMsPerBeatDivision(event.bpm, grid.config.beatDivisions);
                });
                this.restartInterval()
                break;
            case GridEvent.BarsChanged:
                this.updateGrid(event.gridId, (grid: Grid) => {
                    grid.config.bars = event.bars;
                    this.resizeGrid(grid);
                    grid.gridCols = this.notationColumns(grid);
                });
                break;
            case GridEvent.GridSizeChanged:
                this.updateGrid(event.gridId, (grid: Grid) => {
                    grid.config.beatsPerBar = event.beats_per_bar;
                    grid.config.beatDivisions = event.beat_divisions;
                    this.resizeGrid(grid);
                    grid.gridCols = this.notationColumns(grid);
                    grid.msPerBeatDivision = calculateMsPerBeatDivision(grid.config.bpm, grid.config.beatDivisions);
                });
                break;
            case GridEvent.NameChanged:
                this.updateGrid(event.gridId, (grid) => {
                    grid.config.name = event.name
                })
                break;
            case InstrumentEvent.RemoveInstrument:
                this.instrumentManager.removeInstrument(event.instrumentId);
                this.syncInstruments();
                break;
            case InstrumentEvent.AddInstrument:
                this.instrumentManager.addInstrumentFromConfig(defaultInstrumentConfig);
                this.syncInstruments();
                break;
            case InstrumentEvent.MoveUp:
                this.instrumentManager.moveInstrument(event.event, event.instrumentId)
                this.syncInstruments();
                break;
            case InstrumentEvent.MoveDown:
                this.instrumentManager.moveInstrument(event.event, event.instrumentId)
                this.syncInstruments();
                break;
            case ToolbarEvent.Save:
                this.save();
                break;
            case ToolbarEvent.Load:
                this.loadFile(event.file);
                break;
            case ToolbarEvent.Reset:
                this.reset()
                break;
            case DomainEvent.DatabaseError:
                if (event.error == "UnknownError: The user denied permission to access the database.") {
                    this.errors.set("DB Permissions", { message: "You have denied local storage. Please go to settings/content/cookies and enable 'allow sites to save and read cookie data', then refresh the page" })
                } else {
                    this.errors.set(event.doingWhat, { message: `Error ${event.doingWhat}: [${event.error}]` })
                }
                break;
        }
    }

    private unMergeCells(locator: CellLocator) {
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
                    cells_occupied: 1
                };
            }

            console.log("Grid after unmerge", $state.snapshot(grid));
        });
    }

    private mergeCells(locator: CellLocator, side: "left" | "right") {
        this.updateGrid(locator.grid, (grid) => {
            console.log(`Merging grid cell ${side} of cell`, $state.snapshot(locator.cell))
            let clickedCell = grid.rows[locator.row].cells[locator.cell]
            let cellIndexAddition: number
            if (side == "left") { cellIndexAddition = -1 } else { cellIndexAddition = 1 }
            let cellNextToClickedCell: GridCell | undefined
            for (let i = locator.cell + cellIndexAddition; i >= 0 || i < grid.rows[locator.row].cells.length; i += cellIndexAddition) {
                console.log("Getting cell ", i)
                let cell = grid.rows[locator.row].cells[i]
                if (cell.cells_occupied > 0) {
                    cellNextToClickedCell = cell
                    break
                }
            }

            if (clickedCell && cellNextToClickedCell && clickedCell != cellNextToClickedCell) {
                console.log("Cells to merge", $state.snapshot(clickedCell), " & ", $state.snapshot(cellNextToClickedCell))
                // Update the left most cell with the cell occupation
                const cellToExtend = (side === "left") ? cellNextToClickedCell : clickedCell;
                const cellToEmpty = (side === "left") ? clickedCell : cellNextToClickedCell;

                cellToExtend.cells_occupied += cellToEmpty.cells_occupied;
                if (cellToExtend.hits.length > 0) {
                    cellToExtend.hits = Array.from({ length: cellToExtend.cells_occupied + 1 }, () => cellToExtend.hits[0]);
                }
                // Empty cell
                cellToEmpty.cells_occupied = 0;
                cellToEmpty.hits = [];

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

    // Filters chatty events, and logs
    private logEvent(event: AppEvent) {
        console.log('Event:', event.event, event);
    }

    private showContextMenu(event: RightClick) {
        const locator = event.locator
        const grid = this.grids.get(event.gridId)
        const cell = grid?.rows[locator.row].cells[locator.cell]
        let gridCols = grid?.gridCols
        this.contextMenu = {
            x: event.x,
            y: event.y,
            locator: locator,
            isFirstCell: locator.cell == 0,
            isLastCell: gridCols ? locator.cell == gridCols - 1 : false,
            isMergedCell: cell ? cell.cells_occupied > 1 : false
        }
    }

    private removeGrid(event: RemoveGrid) {
        this.grids.delete(event.gridId);
        this.gridService.deleteGrid(event.gridId)
    }

    async onTogglePlaying(newPlaying: boolean, gridId: GridId): Promise<void> {
        if (this.currentlyPlayingGrid) {
            this.currentlyPlayingGrid.playing = false;
        }
        if (newPlaying) {
            await this.instrumentManager.ensureInstrumentsInitialised();
            this.currentlyPlayingGrid = this.grids.get(gridId);
            this.stop()
            this.play()
        } else {
            this.currentlyPlayingGrid = undefined;
            this.stop()
        }
        this.updateGrid(gridId, (grid) => {
            grid.playing = newPlaying;
        }, false);
    }

    // Toggle the hit in the cell when the user clicks the cell
    // Also plays the sound
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
                const hitCount = (2 * cell.cells_occupied) - 1
                nextHits = Array.from({ length: hitCount, }, () => nextHit)
            } else {
                nextHits = cell.hits.map((h) => nextHit)
            }
            // console.log(`Tapped location ${JSON.stringify(locator)} ${currentValue} -> ${newInstrumentHit}`);
            this.updateGridCell(locator, (cell) => {
                cell.hits = nextHits
            })
            this.instrumentManager?.playHit(nextHits[0]);
        } else {
            console.error(
                `Can't toggle grid cell hit as can't find the row. Locator: `,
                locator,
                ', grids:',
                this.grids
            );
        }
    }

    getCell(locator: CellLocator): GridCell | undefined {
        let grid = this.grids.get(locator.grid)
        return grid ? grid.rows[locator.row]?.cells[locator.cell] : undefined
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
                    cells_occupied: 1
                }
                const newCells: GridCell[] = new Array(expectedCells - currentCellCount).fill(emptyCell)
                row.cells.push(...newCells)
            }
        });
    }

    // When instruments are added / removed, we need to remove the rows for the
    // deleted ones, and add rows for the new ones
    syncInstruments() {
        this.updateGrids((grid) => {
            // First remove all rows where the instrument is removed
            let filteredRows = grid.rows.filter((row) => {
                return this.instrumentManager.instruments.has(row.instrument.id);
            });
            // console.log("Filtered rows -", filteredRows)
            // Now add any new instruments
            if (filteredRows.length < this.instrumentManager.instruments.size) {
                let instrument = [...this.instrumentManager.instruments.values()].pop();
                if (instrument) {
                    filteredRows.push(defaultGridRow(instrument, grid.config.bars, grid.config.beatsPerBar, grid.config.beatDivisions));
                }
            }
            // console.log("Filtered rows +", filteredRows)
            grid.rows = filteredRows;
        });
    }

    // Returns a count of the number of columns in the grid
    // Used to decide when to resize the grid
    notationColumns(grid: Grid): number {
        return grid.config.bars * (grid.config.beatsPerBar * grid.config.beatDivisions)
    }

    save() {
        let saveFile: SaveFileV3 = serialiseToSaveFileV3(
            this.file.name,
            [...this.grids.values()],
            [...this.instrumentManager.instruments.values()]
        );
        const text = JSON.stringify(saveFile);
        const blob = new Blob([text], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `GrvMkr_v${saveFile.version}-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async loadFile(file: File) {
        let fileText = await file.text()
        let saveFileBase: SaveFile = JSON.parse(fileText)
        switch (saveFileBase.version) {
            case 1:
                this.loadSaveFileV1(fileText)
                break;
            case 2:
                this.loadSaveFileV2(fileText)
                break;
            case 3:
                this.loadSaveFileV3(fileText)
                break;
        }
    }

    async loadSaveFileV1(saveFileContent: string) {
        let saveFile: SaveFileV1 = JSON.parse(saveFileContent);
        await this.instrumentManager.replaceInstruments(saveFile.instruments);

        this.gridService.deleteAllGrids()
        this.grids.clear();
        saveFile.grids.forEach((grid) => {
            let gridModel: Grid = mapSavedGridV1ToGrid(grid, this.instrumentManager);
            this.addGrid(gridModel)
        });
    }

    async loadSaveFileV2(saveFileContent: string) {
        let saveFile: SaveFileV2 = JSON.parse(saveFileContent);
        await this.instrumentManager.replaceInstruments(saveFile.instruments);

        this.gridService.deleteAllGrids()
        this.grids.clear();
        saveFile.grids.forEach((grid) => {
            let gridModel: Grid = mapSavedGridV2ToGrid(grid, this.instrumentManager);
            this.addGrid(gridModel)
        });
        this.file.name = saveFile.name
        console.log(`Filename ${this.file.name}`)
    }

    async loadSaveFileV3(saveFileContent: string) {
        let saveFile: SaveFileV3 = JSON.parse(saveFileContent);
        await this.instrumentManager.replaceInstruments(saveFile.instruments);

        this.gridService.deleteAllGrids()
        this.grids.clear();
        saveFile.grids.forEach((grid) => {
            let gridModel: Grid = mapSavedGridV3ToGrid(grid, this.instrumentManager);
            this.addGrid(gridModel)
        });
        this.file.name = saveFile.name
        console.log(`Filename ${this.file.name}`)
    }

    async reset() {
        await this.instrumentManager.reset()
        await this.gridService.deleteAllGrids()
        await this.fileService.deleteFile('default file')
        this.grids.clear()
        this.file = defaultFile
        this.initialise()
    }

    play() {
        this.onBeat();
        this.playingIntervalId = setInterval(() => {
            this.onBeat();
        }, this.msPerBeatDivision);
    }

    stop() {
        clearInterval(this.playingIntervalId);
        this.playingIntervalId = undefined;
        this.nextCount = 0;
    }

    restartInterval() {
        clearInterval(this.playingIntervalId);
        this.playingIntervalId = setInterval(() => {
            this.onBeat();
        }, this.msPerBeatDivision);
    }

    async onBeat() {
        if (!this.currentlyPlayingGrid) return;
        let currentlyPlayingGrid = this.currentlyPlayingGrid
        let count = this.nextCount++;

        let playingCell = count % currentlyPlayingGrid.gridCols;
        // Update 
        currentlyPlayingGrid.currentlyPlayingColumn = playingCell;

        let repetition = Math.floor(count / currentlyPlayingGrid.gridCols);
        let bar =
            Math.floor(
                count /
                (currentlyPlayingGrid.config.beatsPerBar * currentlyPlayingGrid.config.beatDivisions)
            ) % currentlyPlayingGrid.config.bars;
        let beat =
            Math.floor(count / currentlyPlayingGrid.config.beatDivisions) %
            currentlyPlayingGrid.config.beatsPerBar;
        let beatDivision = count % currentlyPlayingGrid.config.beatDivisions;

        console.log(
            `Repetition (${currentlyPlayingGrid.msPerBeatDivision}ms): ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, playingCell: ${playingCell}, gridCells; ${currentlyPlayingGrid.gridCols})`
        );

        currentlyPlayingGrid.rows.forEach((row, rowI) => {
            let cell = currentlyPlayingGrid.rows[rowI]?.cells[playingCell]
            if (cell == undefined || cell.hits.length == 0 || cell.cells_occupied < 1) {
                return
            }
            if (cell.hits.length == 1) {
                this.instrumentManager.playHit(cell.hits[0]);
            } else {
                let mergedCellTime = currentlyPlayingGrid.msPerBeatDivision * cell.cells_occupied
                let timeout = mergedCellTime / cell.hits.length
                cell.hits.forEach((hit, i) => {
                    setTimeout(() => {
                        this.instrumentManager.playHit(hit);
                    }, timeout * i)
                })
            }
        });
    }

    // Initialises the app 
    async initialise() {
        await this.instrumentManager.initialise()
        try {
            let file = await this.fileService.getFile('default file')
            if (file) {
                this.file.name = file.name
            }
        } catch (e: any) {
            console.error("Error getting file", e)
            this.onEvent({
                event: DomainEvent.DatabaseError,
                doingWhat: "initialising file name",
                error: e.target.error
            })
        }
        try {
            let grids = await this.gridService.getAllGrids()
            if (grids.length == 0) {
                this.addDefaultGrid()
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
            this.addDefaultGrid()
        }
    }

    addDefaultGrid() {
        const index = this.getNextGridIndex()
        let grid: Grid = $state(buildDefaultGrid(this.instrumentManager.instruments, index));
        this.addGrid(grid)
    }

    getNextGridIndex(): number {
        let indexes = [...this.grids.values()].map((grid) => grid.index).filter((i) => i >= 0)
        return Math.max(...indexes, -1) + 1
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

    // Makes the grid reactive, and sets it in state and the DB
    addGrid(grid: Grid) {
        let reactiveGrid = $state(grid);
        this.grids.set(reactiveGrid.id, reactiveGrid);
        this.trySaveGrid(grid);
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

    // Updates grid in state and DB
    updateFile(withFile: (file: GrvMkrFile) => void) {
        withFile(this.file);
        this.trySaveFile(this.file)
    }

    trySaveFile(file: GrvMkrFile) {
        this.fileService.saveFile(file)
            .catch((e) => {
                console.error(`Error saving file. Error: [${e}]`, file)
                let error = e.target.error
                this.onEvent({
                    event: DomainEvent.DatabaseError,
                    doingWhat: "saving file",
                    error
                })
            });
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
}
