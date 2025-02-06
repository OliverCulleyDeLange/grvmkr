import { type GridId, type Grid, type UiEvent, defaultBar, defaultBeat, defaultBeatDivision, defaultGridRow, GridEvent, ToolbarEvent, type CellLocator, type InstrumentHit, buildDefaultGrid, InstrumentManager, mapSavedGridToGrid, serialiseToJsonV1, type BeatDivision, type GridRow, type HitId, type SaveFileV1, type OnEvent } from "$lib";
import { defaultInstrumentConfig } from "$lib/audio/default_instruments";
import { InstrumentEvent } from "$lib/types/ui/instruments";
import { SvelteMap } from "svelte/reactivity";

export type AppStateStore = {
    grids: Map<GridId, Grid>
    onEvent: OnEvent
}

export function createAppStateStore(instrumentManager: InstrumentManager): AppStateStore {
    let grids: SvelteMap<GridId, Grid> = new SvelteMap();

    let currentlyPlayingGrid: Grid | undefined = $state();
    let msPerBeatDivision = $derived(currentlyPlayingGrid?.msPerBeatDivision);
    let playingIntervalId: number | undefined = undefined;
    let nextCount: number = 0;

    let state = {
        grids,
        onEvent
    }
    return state

    function onEvent(event: UiEvent) {
        console.log('Event:', event.event, event);
        switch (event.event) {
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
                addGrid()
                break;
            case GridEvent.BpmChanged:
                updateGrid(event.gridId, (grid: Grid) => {
                    grid.config.bpm = event.bpm;
                    // TODO DRY this calculation
                    grid.msPerBeatDivision = 60000 / grid.config.bpm / grid.config.beatDivisions;
                });
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
            case InstrumentEvent.InstrumentsInitialised:
                let grid: Grid = $state(buildDefaultGrid(instrumentManager.instruments));
                grids.set(grid.id, grid);
                break;
            case ToolbarEvent.Save:
                save();
                break;
            case ToolbarEvent.Load:
                loadFile(event.file);
                break;
        }
    }

    async function onTogglePlaying(newPlaying: boolean, gridId: GridId): Promise<void> {
        if (currentlyPlayingGrid) {
            currentlyPlayingGrid.playing = false;
        }
        if (newPlaying) {
            await instrumentManager.ensureInstrumentsInitialised();
            currentlyPlayingGrid = grids.get(gridId);
        } else {
            currentlyPlayingGrid = undefined;
        }
        updateGrid(gridId, (grid) => {
            grid.playing = newPlaying;
        });
        if(newPlaying){
            play()
        }else {
            stop()
        }
    }

    // Toggle the hit in the cell when the user clicks the cell
    // Also plays the sound
    function toggleGridHit(locator: CellLocator) {
        let row = grids.get(locator.grid)?.rows[locator.row];
        if (row) {
            let currentValue = currentHit(locator);
            let newInstrumentHit: InstrumentHit | undefined = nextHitType(row, currentValue?.hitId);
            // console.log(`Tapped location ${JSON.stringify(locator)} ${currentValue} -> ${newInstrumentHit}`);
            updateCellHit(locator, newInstrumentHit);
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
        grids.forEach((grid) => {
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

    function updateGrid(id: GridId, withGrid: (grid: Grid) => void) {
        let grid = grids.get(id);
        if (grid) {
            withGrid(grid);
        } else {
            console.error("Couldn't find grid to update with id ", id);
        }
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
            let gridModel: Grid = $state(mapSavedGridToGrid(grid, instrumentManager));
            grids.set(grid.id, gridModel);
            console.log('Loaded grid from file', gridModel);
        });
    }

    function play(): number {
        console.log("Play")
        onBeat();
        playingIntervalId = setInterval(() => {
            onBeat();
        }, msPerBeatDivision);
        return playingIntervalId
    }
    
    function stop() {
        console.log("Stop")
        clearInterval(playingIntervalId);
        playingIntervalId = undefined;
        nextCount = 0;
    }

    // TODO Extract play logic out of view
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

        console.log(
            `Repetition: ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, gridCells; ${currentlyPlayingGrid.gridCols})`
        );

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
        return getCurrentlyPlayingGridCell(currentlyPlayingGrid, locator).hit;
    }


    function addGrid() {
        let newGrid = $state(buildDefaultGrid(instrumentManager.instruments));
        grids.set(newGrid.id, newGrid);
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

    function updateCellHit(locator: CellLocator, hit: InstrumentHit | undefined) {
        let division = getCell(locator);
        if (division) {
            division.hit = hit;
        } else {
            console.error("Couldn't update cell hit");
        }
    }

    function currentHit(locator: CellLocator): InstrumentHit | undefined {
        return getCell(locator)?.hit;
    }

    //TODO DRY
    function getCell(locator: CellLocator): BeatDivision | undefined {
        return grids.get(locator.grid)?.rows[locator.row].notation.bars[locator.notationLocator.bar]
            .beats[locator.notationLocator.beat].divisions[locator.notationLocator.division];
    }

    function getCurrentlyPlayingGridCell(
        currentlyPlayingGrid: Grid,
        locator: CellLocator
    ): BeatDivision {
        return currentlyPlayingGrid.rows[locator.row].notation.bars[locator.notationLocator.bar].beats[
            locator.notationLocator.beat
        ].divisions[locator.notationLocator.division];
    }
}