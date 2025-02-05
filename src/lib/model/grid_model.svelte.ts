import type { InstrumentManager } from "../manager/instrument_manager.svelte";
import type { Bar, Beat, BeatDivision, CellLocator, GridRow, HitId, InstrumentHit, InstrumentId, InstrumentWithId } from "$lib";
import type { NotationGridRowUi, GridCellUi } from "$lib";

export class GridModel {

    constructor(instrumentManager: InstrumentManager) {
        this.instrumentManager = instrumentManager
        this.rows = this.buildGrid(instrumentManager.instruments)
    }

    private instrumentManager: InstrumentManager = $state() as InstrumentManager

    public playing = $state(false);
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

    // Main grid state
    public rows: Array<GridRow> = $state([]);

    // Testing
    public uiModel: NotationGridRowUi[] = $derived(this.buildUi(this.rows, this.instrumentManager));

    buildUi(rows: GridRow[], instrumentManager: InstrumentManager): NotationGridRowUi[] {
        let instruments = instrumentManager.instruments
        let ui = rows.map((row, rowI) => {
            let gridCells: GridCellUi[] = row.notation.bars.flatMap((bar, barI) => {
                return bar.beats.flatMap((beat, beatI) => {
                    let cells: GridCellUi[] = beat.divisions.map((division, divisionI) => {
                        let cellContent = ""
                        if (division.hit) {
                            // console.log(`getting instrument ${division.hit.instrumentId} from `,instruments)
                            let instrument: InstrumentWithId | undefined = instruments.get(division.hit.instrumentId)
                            // console.log(`getting hit ${division.hit.hitId} from instrument:`, instrument)
                            let hit = instrument?.hitTypes.get(division.hit.hitId)
                            // console.log(`got hit `, hit)
                            cellContent = hit?.key ?? ""
                        }
                        return {
                            darken: divisionI == 0,
                            content: cellContent,
                            locator: {
                                row: rowI,
                                notationLocator: { bar: barI, beat: beatI, division: divisionI }
                            }
                        }
                    })
                    return cells
                })
            })
            return {
                instrumentName: instruments.get(row.instrument.id)?.name ?? row.instrument.id,
                gridCells
            }
        })
        return ui
    }

    toggleLocation(locator: CellLocator) {
        let row = this.rows[locator.row]
        let currentValue = this.currentHit(locator);
        let newInstrumentHit: InstrumentHit | undefined = this.nextHitType(row, currentValue?.hitId);
        console.log(`Tapped location ${JSON.stringify(locator)} ${currentValue} -> ${newInstrumentHit}`);
        this.update(locator, newInstrumentHit)
        this.instrumentManager?.playHit(newInstrumentHit)
    }

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


    private buildGrid(instruments: Map<InstrumentId, InstrumentWithId>): Array<GridRow> {
        return Array.from(instruments.entries())
            .map(([_, instrument]) => this.defaultGridRow(instrument))
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

    currentHit(locator: CellLocator): InstrumentHit | undefined {
        return this.getCell(locator).hit
    }

    private update(locator: CellLocator, hit: InstrumentHit | undefined) {
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

