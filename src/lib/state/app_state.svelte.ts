import { updated } from "$app/state";
import { type GridId, type Grid, type UiEvents, defaultBar, defaultBeat, defaultBeatDivision, defaultGridRow, GridEvent, ToolbarEvent, type CellLocator, type InstrumentHit, buildDefaultGrid, InstrumentManager, mapSavedGridToGrid, serialiseToJsonV1, type BeatDivision, type GridRow, type HitId, type SaveFileV1, type OnUiEvent, type NotationLocator, type ErrorId, type AppError, UiEvent, InstrumentService } from "$lib";
import { defaultInstrumentConfig } from "$lib/audio/default_instruments";
import { calculateMsPerBeatDivision } from "$lib/mapper/saved_grid_mapper";
import { GridService } from "$lib/service/grid_service";
import { DomainEvent } from "$lib/types/domain/event";
import type { AppEvent } from "$lib/types/event";
import { InstrumentEvent } from "$lib/types/ui/instruments";
import { SvelteMap } from "svelte/reactivity";
import { formatDateYYYYMMMDD } from "./date";

export class AppStateStore {
    // TODO make private
    public instrumentManager: InstrumentManager = new InstrumentManager();
    private gridService: GridService = new GridService(this.instrumentManager)
    private playingIntervalId: number | undefined = undefined;
    private nextCount: number = 0;

    public fileName: string = $state(`Groove from ${formatDateYYYYMMMDD()}`)
    public grids: SvelteMap<GridId, Grid> = new SvelteMap();
    public currentlyPlayingGrid: Grid | undefined = $state();
    public msPerBeatDivision = $derived(this.currentlyPlayingGrid?.msPerBeatDivision);
    public errors: SvelteMap<ErrorId, AppError> = new SvelteMap();

    onEvent(event: AppEvent) {
        console.log('Event:', event.event, event);
        switch (event.event) {
            case UiEvent.Mounted:
                console.log(this)
                this.initialiseInstruments();
                break;
            case ToolbarEvent.FileNameChanged:
                this.fileName = event.fileName
                break;
            case GridEvent.TogglePlaying:
                this.onTogglePlaying(event.playing, event.gridId);
                break;
            case GridEvent.ToggleGridHit:
                this.toggleGridHit(event.locator);
                break;
            case GridEvent.RemoveGrid:
                this.grids.delete(event.gridId);
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
            case InstrumentEvent.InstrumentsInitialised:
                this.initialiseGrids()
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


    initialiseInstruments() {
        this.instrumentManager.initialise().then(() => {
            this.onEvent({ event: InstrumentEvent.InstrumentsInitialised });
        });
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
        });
    }

    // Toggle the hit in the cell when the user clicks the cell
    // Also plays the sound
    toggleGridHit(locator: CellLocator) {
        let row = this.grids.get(locator.grid)?.rows[locator.row];
        if (row) {
            let currentValue = this.currentHit(locator);
            let newInstrumentHit: InstrumentHit | undefined = this.nextHitType(row, currentValue?.hitId);
            // console.log(`Tapped location ${JSON.stringify(locator)} ${currentValue} -> ${newInstrumentHit}`);
            this.updateGridCell(locator, (cell) => {
                cell.hit = newInstrumentHit;
            })
            this.instrumentManager?.playHit(newInstrumentHit);
        } else {
            console.error(
                `Can't toggle grid cell hit as can't find the row. Locator: `,
                locator,
                ', grids:',
                this.grids
            );
        }
    }

    currentHit(locator: CellLocator): InstrumentHit | undefined {
        let grid = this.grids.get(locator.grid)
        return grid ? this.getGridCell(grid, locator)?.hit : undefined
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
        if (grid.rows.length == 0) return 0;
        let notation = grid.rows[0].notation;
        let bars = notation.bars;
        let beats = bars[0].beats;
        let beatDivisions = beats[0].divisions;
        return bars.length * (beats.length * beatDivisions.length);
    }

    save() {
        let saveFile = serialiseToJsonV1(
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
        let saveFile: SaveFileV1 = JSON.parse(await file.text());
        await this.instrumentManager.replaceInstruments(saveFile.instruments);

        this.grids.clear();
        saveFile.grids.forEach((grid) => {
            let gridModel: Grid = mapSavedGridToGrid(grid, this.instrumentManager);
            this.addGrid(gridModel)
        });
    }

    async reset() {
        await this.instrumentManager.reset()
        await this.gridService.deleteAllGrids()
        this.grids.clear()
        this.initialiseInstruments()
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

        // console.log(
        //     `Repetition (${currentlyPlayingGrid.msPerBeatDivision}ms): ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, gridCells; ${currentlyPlayingGrid.gridCols})`
        // );

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
        return this.getGridCell(currentlyPlayingGrid, locator).hit;
    }

    async initialiseGrids() {
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
        let grid: Grid = $state(buildDefaultGrid(this.instrumentManager.instruments));
        this.addGrid(grid)
    }

    // Returns the next cyclic hit type.
    // Clicking a cell cycles through all the available hit types
    // TODO Would maybe be better to use right clicking or long pressing or something
    nextHitType(row: GridRow, hitId: HitId | undefined): InstrumentHit | undefined {
        let hits = Array.from(row.instrument.hitTypes.values());
        let instrumentHit = {
            instrumentId: row.instrument.id,
            hitId: hits[0].id
        };
        if (hitId == undefined) return instrumentHit;
        let currentIndex = hits.findIndex((ht) => {
            return ht.id == hitId;
        });
        if (currentIndex + 1 >= hits.length) {
            return undefined;
        } else {
            instrumentHit.hitId = hits[currentIndex + 1].id;
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
    updateGrid(id: GridId, withGrid: (grid: Grid) => void) {
        let grid = this.grids.get(id);
        if (grid) {
            withGrid(grid);
            this.trySaveGrid(grid)
        } else {
            console.error("Couldn't find grid to update with id ", id);
        }
    }

    trySaveGrid(grid: Grid) {
        this.gridService.saveGrid(grid)
            .catch((e) => {
                let error = e.target.error
                console.error("Error saving grid", error, e)
                this.onEvent({
                    event: DomainEvent.DatabaseError,
                    doingWhat: "saving grid",
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

}
