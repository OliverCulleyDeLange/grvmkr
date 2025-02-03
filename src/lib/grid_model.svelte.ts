import type GridCell from "../routes/GridCell.svelte";
import { AudioManager } from "./audio_manager";
import { defaultInstruments } from "./default";
import type { InstrumentManager } from "./instrument_manager.svelte";
import type { Bar, Beat, BeatDivision, CellLocator, GridRow, HitTypeKey, InstrumentConfig, InstrumentHit, InstrumentId, NotationLocator } from "./types";
import type { NotationGridRowUi, GridCellUi } from "./types_ui";

export class GridModel {

    constructor(instrumentManager: InstrumentManager) {
        this.instrumentManager = instrumentManager
        this.audioManager.addInstruments(instrumentManager.instruments)
        this.rows = this.buildGrid(instrumentManager.instruments)
        console.log(this.instrumentManager)
    }

    private audioManager = new AudioManager()
    private instrumentManager: InstrumentManager | undefined = $state()

    public playing = $state(false);
    public bpm = $state(120);
    // Currently playing column in the grid
    public currentColumn = $state(0);

    // Configurable grid state
    public bars = $state(1);
    public beatsPerBar = $state(4);
    public beatNoteFraction = $state(4);

    public msPerBeatDivision = $derived(60000 / this.bpm / this.beatNoteFraction);

    // Total number of grid cells, derives from configurable grid state
    public gridCols = $derived(this.beatNoteFraction * this.beatsPerBar * this.bars);

    // Main grid state
    public rows: Array<GridRow> = $state([]);

    // Testing
    public uiModel: NotationGridRowUi[] = $derived(this.buildUi(this.rows, this.instrumentManager?.instruments));

    buildUi(rows: GridRow[], instruments: any | undefined): NotationGridRowUi[] {
        let ui = rows.map((row, rowI) => {
            let gridCells: GridCellUi[] = row.notation.bars.flatMap((bar, barI) => {
                return bar.beats.flatMap((beat, beatI) => {
                    let cells: GridCellUi[] = beat.divisions.map((division, divisionI) => {
                        return {
                            darken: divisionI == 0,
                            content: division.hitType ?? "",
                            locator: {
                                row: rowI,
                                notationLocator: {bar: barI, beat: beatI, division: divisionI }
                            }
                        }
                    })
                    return cells
                })
            })
            return {
                instrumentName: instruments.get(row.instrumentId)?.name ?? row.instrumentId,
                gridCells
            }
        })
        return ui
    }

    async initInstruments() {
        await this.audioManager.initInstruments()
    }

    toggleLocation(locator: CellLocator) {
        let row = this.rows[locator.row]
        let currentValue = this.currentHit(locator);
        let newValue = this.nextHitType(row, currentValue.hitKey);
        console.log(`Tapped location ${JSON.stringify(locator)} ${currentValue} -> ${newValue}`);
        this.update(locator, newValue)
    }

    playBeat(count: number) {
        let cell = count % this.gridCols
        let repetition = Math.floor(count / this.gridCols);
        let bar = Math.floor(count / (this.beatsPerBar * this.beatNoteFraction)) % this.bars;
        let beat = Math.floor(count / this.beatNoteFraction) % this.beatsPerBar;
        let beatDivision = count % this.beatNoteFraction;

        console.log(`Repetition: ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, gridCells; ${this.gridCols})`);

        for (let row of this.rows) {
            let locator: CellLocator = {
                row: row.config.gridIndex,
                notationLocator: { bar: bar, beat: beat, division: beatDivision }
            }
            this.audioManager.playHit(this.currentHit(locator));
        }
        this.currentColumn = cell
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

    private buildGrid(instruments: Map<InstrumentId, InstrumentConfig>): Array<GridRow> {
        return Array.from(instruments.entries()).map(
            ([id, config]) => {
                let notation = {
                    bars: Array.from({ length: this.bars }, () => this.defaultBar())
                }
                return { config, notation, instrumentId: id }
            }
        )
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
        return { hitType: undefined }
    }

    private nextHitType(row: GridRow, hitTypeKey: HitTypeKey | undefined): HitTypeKey | undefined {
        if (hitTypeKey == undefined) return row.config.hitTypes[0].key
        let currentIndex = row.config.hitTypes.findIndex((ht) => {
            // console.log(`ht.key ${ht.key} == hitTypeKey ${hitTypeKey}`)
            return ht.key == hitTypeKey
        })
        // console.log(`curr idx ${currentIndex}`)
        if (currentIndex + 1 >= row.config.hitTypes.length) {
            return undefined
        } else {
            return row.config.hitTypes[currentIndex + 1].key
        }
    }

    private currentHit(locator: CellLocator): InstrumentHit {
        let row = this.rows[locator.row]
        let hitTypeKey = this.getCell(locator).hitType
        return {
            instrumentId: row.instrumentId,
            hitKey: hitTypeKey
        }
    }

    private update(locator: CellLocator, newHitTypeKey: HitTypeKey | undefined) {
        let division = this.getCell(locator)
        division.hitType = newHitTypeKey
    }

    private getCell(locator: CellLocator): BeatDivision {
        return this.rows[locator.row]
            .notation
            .bars[locator.notationLocator.bar]
            .beats[locator.notationLocator.beat]
            .divisions[locator.notationLocator.division]
    }
}

