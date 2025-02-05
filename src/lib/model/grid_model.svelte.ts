import type { InstrumentManager } from "../manager/instrument_manager.svelte";
import { mapRowsToGridUi, type Bar, type Beat, type BeatDivision, type CellLocator, type GridRow, type HitId, type InstrumentHit, type InstrumentId, type InstrumentWithId } from "$lib";
import type { Grid, NotationGridRowUi } from "$lib";
import { GridService } from "$lib/service/grid_service";

export class GridModel {

    constructor(instrumentManager: InstrumentManager) {
        this.instrumentManager = instrumentManager
        this.rows = this.buildGridRows(instrumentManager.instruments)
        this.grid = this.buildGrid(instrumentManager.instruments)
        this.gridService.saveGrid(this.grid)
    }

    private gridService: GridService = new GridService()
    private instrumentManager: InstrumentManager = $state() as InstrumentManager

    public bpm = $state(120);
    // Currently playing column in the grid
    public currentColumn = $state(0);

    // Configurable grid state
    public bars = $state(1);
    public beatsPerBar = $state(4);
    public beatNoteFraction = $state(4);

    public msPerBeatDivision = $derived(60000 / this.bpm / this.beatNoteFraction);

    // Total number of grid cells, derived from configurable grid state
    public gridCols = $derived(this.beatNoteFraction * this.beatsPerBar * this.bars);

    // Grid domain state
    public rows: Array<GridRow> = $state([]);
    public grid: Grid | undefined = $state();

    // Grid UI state
    public uiModel: NotationGridRowUi[] = $derived(mapRowsToGridUi(this.rows, this.instrumentManager));

    // Toggle the hit in the cell when the user clicks the cell
    // Also plays the sound
    toggleLocation(locator: CellLocator) {
        let row = this.rows[locator.row]
        let currentValue = this.currentHit(locator);
        let newInstrumentHit: InstrumentHit | undefined = this.nextHitType(row, currentValue?.hitId);
        // console.log(`Tapped location ${JSON.stringify(locator)} ${currentValue} -> ${newInstrumentHit}`);
        this.updateCellHit(locator, newInstrumentHit)
        this.instrumentManager?.playHit(newInstrumentHit)
    }

    // Returns a count of the number of columns in the grid
    // Used to decide when to resize the grid
    notationColumns(): number {
        if (this.rows.length == 0) return 0
        let notation = this.rows[0].notation
        let bars = notation.bars
        let beats = bars[0].beats
        let beatDivisions = beats[0].divisions
        return bars.length * (beats.length * beatDivisions.length)
    }

    resizeGrid() {
        // TODO Tidy this deeply nested fucktion up
        this.rows.forEach((row) => {
            if (this.bars < row.notation.bars.length) {
                row.notation.bars.length = this.bars
            } else {
                let newBars = Array.from({ length: this.bars - row.notation.bars.length }, () => this.defaultBar())
                row.notation.bars.push(...newBars)
            }
            row.notation.bars.forEach((bar) => {
                let beatsPerBar = this.beatsPerBar
                if (beatsPerBar < bar.beats.length) {
                    bar.beats.length = beatsPerBar
                } else {
                    let newBeats = Array.from({ length: beatsPerBar - bar.beats.length }, () => this.defaultBeat())
                    bar.beats.push(...newBeats)
                }
                bar.beats.forEach((beat) => {
                    let beatNoteFraction = this.beatNoteFraction
                    if (beatNoteFraction < beat.divisions.length) {
                        beat.divisions.length = beatNoteFraction
                    } else {
                        let newDivisions = Array.from({ length: beatNoteFraction - beat.divisions.length }, () => this.defaultBeatDivision())
                        beat.divisions.push(...newDivisions)
                    }
                })
            })
        });
    }

    // When instruments are added / removed, we need to remove the rows for the 
    // deleted ones, and add rows for the new ones
    syncInstruments() {
        // First remove all rows where the instrument is removed
        let filteredRows = this.rows.filter((row) => {
            return this.instrumentManager.instruments.has(row.instrument.id)
        })
        // console.log("Filtered rows -", filteredRows)
        // Now add any new instruments
        if (filteredRows.length < this.instrumentManager.instruments.size) {
            let instrument = [...this.instrumentManager.instruments.values()].pop()
            if (instrument) { 
                filteredRows.push(this.defaultGridRow(instrument)) 
            }
        }
        // console.log("Filtered rows +", filteredRows)
        this.rows = filteredRows
    }

    currentHit(locator: CellLocator): InstrumentHit | undefined {
        return this.getCell(locator).hit
    }

    // When we remove a hit, we need to remove all the cells which contain that hit
    removeHits(removedHit: InstrumentHit) {
        console.log("removeHits")
        this.rows.forEach((row) => {
            row.notation.bars.forEach((bar) => {
                bar.beats.forEach((beat) => {
                    beat.divisions.forEach((division) => {
                        if (division.hit == removedHit){
                            division.hit == undefined
                        }
                    })
                })
            })
        })
    }

    private buildGrid(instruments: Map<InstrumentId, InstrumentWithId>): Grid {
        let grid: Grid = {
            id: `grid_${crypto.randomUUID()}`,
            config: {
                bpm: this.bpm,
                bars: this.bars,
                beatsPerBar: this.beatsPerBar,
                beatDivisions: this.beatNoteFraction
            },
            rows: this.buildGridRows(instruments)
        }
        return grid
    }
    
    private buildGridRows(instruments: Map<InstrumentId, InstrumentWithId>): GridRow[] {
        return Array.from(instruments.values())
            .map((instrument) => this.defaultGridRow(instrument))
    }

    private defaultGridRow(instrument: InstrumentWithId): GridRow {
        let notation = {
            bars: Array.from({ length: this.bars }, () => this.defaultBar())
        }
        return { instrument, notation }
    }

    private defaultBar(): Bar {
        return {
            beats: Array.from({ length: this.beatsPerBar }, () => this.defaultBeat())
        }
    }

    private defaultBeat(): Beat {
        return {
            divisions: Array.from({ length: this.beatNoteFraction }, () => this.defaultBeatDivision())
        }
    }

    private defaultBeatDivision(): BeatDivision {
        return { hit: undefined }
    }

    // Returns the next cyclic hit type. 
    // Clicking a cell cycles through all the available hit types
    // TODO Would maybe be better to use right clicking or long pressing or something 
    private nextHitType(row: GridRow, hitId: HitId | undefined): InstrumentHit | undefined {
        let hits = Array.from(row.instrument.hitTypes.values());
        let instrumentHit = {
            instrumentId: row.instrument.id,
            hitId: hits[0].id
        }
        if (hitId == undefined) return instrumentHit
        let currentIndex = hits.findIndex((ht) => {
            return ht.id == hitId
        })
        if (currentIndex + 1 >= hits.length) {
            return undefined
        } else {
            instrumentHit.hitId = hits[currentIndex + 1].id
            return instrumentHit
        }
    }

    private updateCellHit(locator: CellLocator, hit: InstrumentHit | undefined) {
        let division = this.getCell(locator)
        division.hit = hit
    }

    private getCell(locator: CellLocator): BeatDivision {
        return this.rows[locator.row]
            .notation
            .bars[locator.notationLocator.bar]
            .beats[locator.notationLocator.beat]
            .divisions[locator.notationLocator.division]
    }
}

