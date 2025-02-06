import { updated } from "$app/state";
import { type GridId, type Grid, type UiEvents, defaultBar, defaultBeat, defaultBeatDivision, defaultGridRow, GridEvent, ToolbarEvent, type CellLocator, type InstrumentHit, buildDefaultGrid, InstrumentManager, mapSavedGridToGrid, serialiseToJsonV1, type BeatDivision, type GridRow, type HitId, type SaveFileV1, type OnUiEvent, type NotationLocator, type ErrorId, type AppError, UiEvent, InstrumentService } from "$lib";
import { defaultInstrumentConfig } from "$lib/audio/default_instruments";
import { calculateMsPerBeatDivision } from "$lib/mapper/saved_grid_mapper";
import { GridService } from "$lib/service/grid_service";
import { DomainEvent } from "$lib/types/domain/event";
import type { AppEvent } from "$lib/types/event";
import { InstrumentEvent } from "$lib/types/ui/instruments";
import { SvelteMap } from "svelte/reactivity";

export type AppStateStore = {
    grids: Map<GridId, Grid>
    errors: Map<ErrorId, AppError>
    onEvent: OnUiEvent,
    instrumentManager: InstrumentManager
}

export function createAppStateStore(): AppStateStore {
    let instrumentManager: InstrumentManager = new InstrumentManager();

    let grids: SvelteMap<GridId, Grid> = new SvelteMap();

    let gridService: GridService = new GridService(instrumentManager)

    let currentlyPlayingGrid: Grid | undefined = $state();
    let msPerBeatDivision = $derived(currentlyPlayingGrid?.msPerBeatDivision);
    let playingIntervalId: number | undefined = undefined;
    let nextCount: number = 0;

    let errors: SvelteMap<ErrorId, AppError> = new SvelteMap()

    let state = {
        grids,
        errors,
        onEvent,
        instrumentManager
    }
    return state

    function onEvent(event: AppEvent) {
        console.log('Event:', event.event, event);
        switch (event.event) {
            case UiEvent.Mounted:
                initialiseInstruments();
                break;
            case GridEvent.TogglePlaying:
                onTogglePlaying(event.playing, event.gridId);
                break;
            case GridEvent.ToggleGridHit:
                toggleGridHit(event.locator);
                break;
            case GridEvent.RemoveGrid:
                grids.delete(event.gridId);
                break;
            case GridEvent.AddGrid:
                addDefaultGrid()
                break;
            case GridEvent.BpmChanged:
                updateGrid(event.gridId, (grid: Grid) => {
                    grid.config.bpm = event.bpm;
                    grid.msPerBeatDivision = calculateMsPerBeatDivision(event.bpm, grid.config.beatDivisions);
                });
                restartInterval()
                break;
            case GridEvent.BarsChanged:
                updateGrid(event.gridId, (grid: Grid) => {
                    grid.config.bars = event.bars;
                    resizeGrid(grid);
                    grid.gridCols = notationColumns(grid);
                });
                break;
            case GridEvent.GridSizeChanged:
                updateGrid(event.gridId, (grid: Grid) => {
                    grid.config.beatsPerBar = event.beats_per_bar;
                    grid.config.beatDivisions = event.beat_divisions;
                    resizeGrid(grid);
                    grid.gridCols = notationColumns(grid);
                });
                break;
            case InstrumentEvent.RemoveInstrument:
                instrumentManager.removeInstrument(event.instrumentId);
                syncInstruments();
                break;
            case InstrumentEvent.AddInstrument:
                instrumentManager.addInstrumentFromConfig(defaultInstrumentConfig);
                syncInstruments();
                break;
            case InstrumentEvent.MoveUp:
                instrumentManager.moveInstrument(event.event, event.instrumentId)
                syncInstruments();
                break;
                case InstrumentEvent.MoveDown:
                instrumentManager.moveInstrument(event.event, event.instrumentId)
                syncInstruments();
                break;
            case InstrumentEvent.InstrumentsInitialised:
                initialiseGrids()
                break;
            case ToolbarEvent.Save:
                save();
                break;
            case ToolbarEvent.Load:
                loadFile(event.file);
                break;
            case ToolbarEvent.Reset:
                reset()
                break;
            case DomainEvent.DatabaseError:
                if (event.error == "UnknownError: The user denied permission to access the database.") {
                    errors.set("DB Permissions", { message: "You have denied local storage. Please go to settings/content/cookies and enable 'allow sites to save and read cookie data', then refresh the page" })
                } else {
                    errors.set(event.doingWhat, { message: `Error ${event.doingWhat}: [${event.error}]` })
                }
                break;
        }
    }


    function initialiseInstruments() {
        instrumentManager.initialise().then(() => {
            onEvent({ event: InstrumentEvent.InstrumentsInitialised });
        });
    }

    async function onTogglePlaying(newPlaying: boolean, gridId: GridId): Promise<void> {
        if (currentlyPlayingGrid) {
            currentlyPlayingGrid.playing = false;
        }
        if (newPlaying) {
            await instrumentManager.ensureInstrumentsInitialised();
            currentlyPlayingGrid = grids.get(gridId);
            stop()
            play()
        } else {
            currentlyPlayingGrid = undefined;
            stop()
        }
        updateGrid(gridId, (grid) => {
            grid.playing = newPlaying;
        });
    }

    // Toggle the hit in the cell when the user clicks the cell
    // Also plays the sound
    function toggleGridHit(locator: CellLocator) {
        let row = grids.get(locator.grid)?.rows[locator.row];
        if (row) {
            let currentValue = currentHit(locator);
            let newInstrumentHit: InstrumentHit | undefined = nextHitType(row, currentValue?.hitId);
            // console.log(`Tapped location ${JSON.stringify(locator)} ${currentValue} -> ${newInstrumentHit}`);
            updateGridCell(locator, (cell) => {
                cell.hit = newInstrumentHit;
            })
            instrumentManager?.playHit(newInstrumentHit);
        } else {
            console.error(
                `Can't toggle grid cell hit as can't find the row. Locator: `,
                locator,
                ', grids:',
                grids
            );
        }
    }

    function currentHit(locator: CellLocator): InstrumentHit | undefined {
        let grid = grids.get(locator.grid)
        return grid ? getGridCell(grid, locator)?.hit : undefined
    }

    function resizeGrid(grid: Grid) {
        // TODO Tidy this deeply nested fucktion up
        grid.rows.forEach((row) => {
            if (grid.config.bars < row.notation.bars.length) {
                row.notation.bars.length = grid.config.bars;
            } else {
                let newBars = Array.from({ length: grid.config.bars - row.notation.bars.length }, () =>
                    defaultBar()
                );
                row.notation.bars.push(...newBars);
            }
            row.notation.bars.forEach((bar) => {
                let beatsPerBar = grid.config.beatsPerBar;
                if (beatsPerBar < bar.beats.length) {
                    bar.beats.length = beatsPerBar;
                } else {
                    let newBeats = Array.from({ length: beatsPerBar - bar.beats.length }, () =>
                        defaultBeat()
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
    function syncInstruments() {
        updateGrids((grid) => {
            // First remove all rows where the instrument is removed
            let filteredRows = grid.rows.filter((row) => {
                return instrumentManager.instruments.has(row.instrument.id);
            });
            // console.log("Filtered rows -", filteredRows)
            // Now add any new instruments
            if (filteredRows.length < instrumentManager.instruments.size) {
                let instrument = [...instrumentManager.instruments.values()].pop();
                if (instrument) {
                    filteredRows.push(defaultGridRow(instrument));
                }
            }
            // console.log("Filtered rows +", filteredRows)
            grid.rows = filteredRows;
        });
    }

    // Returns a count of the number of columns in the grid
    // Used to decide when to resize the grid
    function notationColumns(grid: Grid): number {
        if (grid.rows.length == 0) return 0;
        let notation = grid.rows[0].notation;
        let bars = notation.bars;
        let beats = bars[0].beats;
        let beatDivisions = beats[0].divisions;
        return bars.length * (beats.length * beatDivisions.length);
    }

    function save() {
        let saveFile = serialiseToJsonV1(
            [...grids.values()],
            [...instrumentManager.instruments.values()]
        );
        const text = JSON.stringify(saveFile);
        const blob = new Blob([text], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `GrvMkr_v${saveFile.version}-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async function loadFile(file: File) {
        let saveFile: SaveFileV1 = JSON.parse(await file.text());
        await instrumentManager.replaceInstruments(saveFile.instruments);

        grids.clear();
        saveFile.grids.forEach((grid) => {
            let gridModel: Grid = mapSavedGridToGrid(grid, instrumentManager);
            addGrid(gridModel)
        });
    }

    async function reset() {
        await instrumentManager.reset()
        await gridService.deleteAllGrids()
        grids.clear()
        initialiseInstruments()
    }

    function play() {
        onBeat();
        playingIntervalId = setInterval(() => {
            onBeat();
        }, msPerBeatDivision);
    }

    function stop() {
        clearInterval(playingIntervalId);
        playingIntervalId = undefined;
        nextCount = 0;
    }
    
    function restartInterval() {
        clearInterval(playingIntervalId);
        playingIntervalId = setInterval(() => {
            onBeat();
        }, msPerBeatDivision);
    }

    async function onBeat() {
        if (!currentlyPlayingGrid) return;
        let count = nextCount++;
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
            let currentHit = getCurrentHit(currentlyPlayingGrid, locator);
            instrumentManager.playHit(currentHit);
        });

        currentlyPlayingGrid.currentlyPlayingColumn = cell;
    }

    function getCurrentHit(
        currentlyPlayingGrid: Grid | undefined,
        locator: CellLocator
    ): InstrumentHit | undefined {
        if (!currentlyPlayingGrid) return undefined;
        return getGridCell(currentlyPlayingGrid, locator).hit;
    }

    async function initialiseGrids() {
        try {
            let grids = await gridService.getAllGrids()
            if (grids.length == 0) {
                addDefaultGrid()
            } else {
                grids.forEach((grid) => addGrid(grid))
            }
        } catch (e: any) {
            console.error("Error getting all grids:", e)
            onEvent({
                event: DomainEvent.DatabaseError,
                doingWhat: "initialising grids",
                error: e.target.error
            })
            addDefaultGrid()
        }
    }

    function addDefaultGrid() {
        let grid: Grid = $state(buildDefaultGrid(instrumentManager.instruments));
        addGrid(grid)
    }

    // Returns the next cyclic hit type.
    // Clicking a cell cycles through all the available hit types
    // TODO Would maybe be better to use right clicking or long pressing or something
    function nextHitType(row: GridRow, hitId: HitId | undefined): InstrumentHit | undefined {
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
    function addGrid(grid: Grid) {
        let reactiveGrid = $state(grid);
        grids.set(reactiveGrid.id, reactiveGrid);
        trySaveGrid(grid);
    }

    // Updates grids in state and DB
    function updateGrids(withGrid: (grid: Grid) => void) {
        grids.forEach((grid) => {
            withGrid(grid)
            trySaveGrid(grid)
        })
    }

    // Updates grid in state and DB
    function updateGrid(id: GridId, withGrid: (grid: Grid) => void) {
        let grid = grids.get(id);
        if (grid) {
            withGrid(grid);
            trySaveGrid(grid)
        } else {
            console.error("Couldn't find grid to update with id ", id);
        }
    }

    function trySaveGrid(grid: Grid) {
        gridService.saveGrid(grid)
            .catch((e) => {
                let error = e.target.error
                console.error("Error saving grid", error, e)
                onEvent({
                    event: DomainEvent.DatabaseError,
                    doingWhat: "saving grid",
                    error
                })
            });
    }

    // Updates grid cell in state and DB
    function updateGridCell(locator: CellLocator, withGridCell: (division: BeatDivision) => void) {
        updateGrid(locator.grid, (grid) => {
            let cell = getGridCell(grid, locator)
            if (cell) {
                withGridCell(cell)
            } else {
                console.error("Couldn't find grid cell to update with locator ", locator);
            }
        })
    }

    function getGridCell(grid: Grid, locator: CellLocator): BeatDivision {
        return grid.rows[locator.row].notation.bars[locator.notationLocator.bar]
            .beats[locator.notationLocator.beat].divisions[locator.notationLocator.division]
    }
    
}
