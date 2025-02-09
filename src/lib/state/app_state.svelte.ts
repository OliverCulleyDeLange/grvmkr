import { buildDefaultGrid, calculateMsPerBeatDivision, ContextMenuEvent, defaultBar, defaultBeat, defaultBeatDivision, defaultFile, defaultGridRow, GridEvent, InstrumentManager, mapSavedGridV1ToGrid, mapSavedGridV2ToGrid, serialiseToSaveFileV3, ToolbarEvent, UiEvent, type AppError, type BeatDivision, type CellLocator, type ContextMenu, type ErrorId, type Grid, type GridConfig, type GridId, type GridRow, type GrvMkrFile, type HitId, type InstrumentHit, type RemoveGrid, type RightClick, type SaveFile, type SaveFileV1, type SaveFileV2, type SaveFileV3 } from "$lib";
import { defaultInstrumentConfig } from "$lib/audio/default_instruments";
import { FileService } from "$lib/service/file_service";
import { GridService } from "$lib/service/grid_service";
import { DomainEvent } from "$lib/types/domain/event";
import type { AppEvent } from "$lib/types/event";
import { InstrumentEvent } from "$lib/types/ui/instruments";
import { SvelteMap } from "svelte/reactivity";
import type GridCell from "../../routes/ui_elements/GridCell.svelte";

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
            case UiEvent.DocumentClick:
                this.contextMenu = undefined
                break;
            case ContextMenuEvent.MergeCells:
                this.mergeCells(event.locator, event.side)
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

    private mergeCells(locator: CellLocator, side: "left" | "right") {
        this.updateGrid(locator.grid, (grid) => {
            console.log(`Merging grid cell ${side}`, $state.snapshot(locator.notationLocator))
            let cell = this.getGridCell(grid, locator)
            let mergeCellLocator = getCellLocatorTo(side, locator, grid.config)
            let cellToMerge = this.getGridCell(grid, mergeCellLocator)
            if (cell && cellToMerge && cell != cellToMerge) {
                // console.log("Cells to merge", $state.snapshot(locator.notationLocator), $state.snapshot(mergeCellLocator.notationLocator))
                cell.cellsOccupied++
                cell.hits.push(...cellToMerge.hits)
                this.removeGridCell(grid, mergeCellLocator)
                console.log("Cell after merge", $state.snapshot(cell))
                console.log("Grid after merge", $state.snapshot(grid))
            } else {
                console.error("Couldn't find grid cell to merge with locator ", locator);
            }
        })
    }

    // Filters chatty events, and logs
    private logEvent(event: AppEvent) {
        if (event.event != UiEvent.DocumentClick) {
            console.log('Event:', event.event, event);
        }
    }

    private showContextMenu(event: RightClick) {
        this.contextMenu = { x: event.x, y: event.y, locator: event.locator }
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
                const hitCount = (2 * cell.cellsOccupied) - 1
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

    getCell(locator: CellLocator): BeatDivision | undefined {
        let grid = this.grids.get(locator.grid)
        return grid ? this.getGridCell(grid, locator) : undefined
    }

    resizeGrid(grid: Grid) {
        // TODO Tidy this deeply nested fucktion up
        grid.rows.forEach((row) => {
            if (grid.config.bars < row.notation.bars.length) {
                row.notation.bars.length = grid.config.bars;
            } else {
                let newBars = Array.from({ length: grid.config.bars - row.notation.bars.length }, () =>
                    defaultBar(grid.config.beatsPerBar, grid.config.beatDivisions)
                );
                row.notation.bars.push(...newBars);
            }
            row.notation.bars.forEach((bar) => {
                let beatsPerBar = grid.config.beatsPerBar;
                if (beatsPerBar < bar.beats.length) {
                    bar.beats.length = beatsPerBar;
                } else {
                    let newBeats = Array.from({ length: beatsPerBar - bar.beats.length }, () =>
                        defaultBeat(grid.config.beatDivisions)
                    );
                    bar.beats.push(...newBeats);
                }
                bar.beats.forEach((beat) => {
                    let beatNoteFraction = grid.config.beatDivisions;
                    if (beatNoteFraction < beat.divisions.length) {
                        beat.divisions.length = beatNoteFraction;
                    } else {
                        let newDivisions = Array.from(
                            { length: beatNoteFraction - beat.divisions.length },
                            () => defaultBeatDivision()
                        );
                        beat.divisions.push(...newDivisions);
                    }
                });
            });
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
        // Not sure what this nonsense was about, pretty sure its not required anymore. 
        // if (grid.rows.length == 0) return 0;
        // let notation = grid.rows[0].notation;
        // let bars = notation.bars;
        // let beats = bars[0].beats;
        // let beatDivisions = beats[0].divisions;
        // return bars.length * (beats.length * beatDivisions.length);
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

        let cell = count % currentlyPlayingGrid.gridCols;
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
            `Repetition (${currentlyPlayingGrid.msPerBeatDivision}ms): ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, gridCells; ${currentlyPlayingGrid.gridCols})`
        );

        currentlyPlayingGrid.rows.forEach((row, rowI) => {
            let locator: CellLocator = {
                grid: currentlyPlayingGrid!.id,
                row: rowI,
                notationLocator: { bar: bar, beat: beat, division: beatDivision }
            };
            let currentHit = this.getCurrentHit(currentlyPlayingGrid, locator);
            this.instrumentManager.playHit(currentHit);
        });

        currentlyPlayingGrid.currentlyPlayingColumn = cell;
    }

    getCurrentHit(
        currentlyPlayingGrid: Grid | undefined,
        locator: CellLocator
    ): InstrumentHit | undefined {
        if (!currentlyPlayingGrid) return undefined;
        return this.getGridCell(currentlyPlayingGrid, locator).hits[0];
    }

    // Initialises the app 
    async initialise() {
        await this.instrumentManager.initialise()
        try {
            let file = await this.fileService.getFile('default file')
            if (file) {
                this.file.name = file.name
            }
        } catch (e) {

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
        console.log(`indexes`, indexes)
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
    updateGridCell(locator: CellLocator, withGridCell: (division: BeatDivision) => void) {
        this.updateGrid(locator.grid, (grid) => {
            let cell = this.getGridCell(grid, locator)
            if (cell) {
                withGridCell(cell)
            } else {
                console.error("Couldn't find grid cell to update with locator ", locator);
            }
        })
    }

    getGridCell(grid: Grid, locator: CellLocator): BeatDivision {
        return grid.rows[locator.row].notation.bars[locator.notationLocator.bar]
            .beats[locator.notationLocator.beat].divisions[locator.notationLocator.division]
    }

    removeGridCell(grid: Grid, locator: CellLocator) {
        let divisions = grid.rows[locator.row].notation.bars[locator.notationLocator.bar]
            .beats[locator.notationLocator.beat].divisions
        divisions.splice(locator.notationLocator.division, 1);
    }

}

//TODO This needs massively simplifying
function getCellLocatorTo(side: 'left' | 'right', locator: CellLocator, config: GridConfig): CellLocator {
    switch (side) {
        case "left":
            if (locator.notationLocator.division == 0) {
                if (locator.notationLocator.beat == 0) {
                    if (locator.notationLocator.bar == 0) {
                        // If first division, beat and bar, we can't merge left! This is an error and shouldn't be possible.
                        console.error("Trying to merge left on first division, of first beat of first bar. This shouldn't be possible.")
                        return locator
                    } else {
                        // If first division of first beat, we must go back a bar
                        return {
                            ...locator, notationLocator: {
                                bar: locator.notationLocator.bar - 1,
                                beat: config.beatsPerBar,
                                division: config.beatDivisions - 1
                            }
                        }
                    }
                } else {
                    // Left of first division is last division of previous beat
                    return {
                        ...locator, notationLocator: {
                            bar: locator.notationLocator.bar,
                            beat: locator.notationLocator.beat - 1,
                            division: config.beatDivisions - 1
                        }
                    }
                }
            } else {
                // Left of any other division is simply division -1
                return {
                    ...locator, notationLocator: {
                        bar: locator.notationLocator.bar,
                        beat: locator.notationLocator.beat,
                        division: locator.notationLocator.division - 1
                    }
                }
            }
        case "right":
            if (locator.notationLocator.division == config.beatDivisions - 1) {
                if (locator.notationLocator.beat == config.beatsPerBar - 1) {
                    if (locator.notationLocator.bar == config.bars - 1) {
                        // If last division, beat and bar, we can't merge right! This is an error and shouldn't be possible.
                        console.error("Trying to merge right on last division, of last beat of lsat bar. This shouldn't be possible.")
                        return locator
                    } else {
                        // If last division of last beat, we must go forward a bar
                        return {
                            ...locator, notationLocator: {
                                bar: locator.notationLocator.bar + 1,
                                beat: 0,
                                division: 0
                            }
                        }
                    }
                } else {
                    // Right of last division is first division of next beat
                    return {
                        ...locator, notationLocator: {
                            bar: locator.notationLocator.bar,
                            beat: locator.notationLocator.beat + 1,
                            division: 0
                        }
                    }
                }
            } else {
                // Right of any other division is simply division -1
                return {
                    ...locator, notationLocator: {
                        bar: locator.notationLocator.bar,
                        beat: locator.notationLocator.beat,
                        division: locator.notationLocator.division + 1
                    }
                }
            }
    }
}

