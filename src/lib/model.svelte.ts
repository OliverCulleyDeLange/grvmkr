import { AudioManager } from "./audio_manager";
import { defaultInstruments } from "./default";
import type { BeatDivision, CellLocator, GridRow, HitTypeKey, InstrumentConfig, InstrumentHit, NotationLocator } from "./types";

export class GridModel {

    private audioManager = new AudioManager()

    public currentCell = $state(0);

    public cellsPerBeat = $state(4);
    public beatsPerBar = $state(4);
    public bars = $state(2);
    public beatNote = $state(4);
    public gridCells = $derived(this.cellsPerBeat * this.beatsPerBar * this.bars);

    public rows: Array<GridRow> = $state(defaultInstruments.map(
        (config: InstrumentConfig) => {
            let notation = {
                bars: Array.from({ length: this.bars }, () => {
                    return {
                        beats: Array.from({ length: this.beatsPerBar }, () => {
                            return {
                                divisions: Array.from({ length: this.cellsPerBeat }, () => {
                                    return { hitType: undefined }
                                })
                            }
                        })
                    }
                })
            }
            return { config, notation }
        }
    ));

    constructor() {
        this.audioManager.addInstruments(defaultInstruments)
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
        // console.log(JSON.stringify(this.rows))
    }

    playBeat(count: number) {
        let cell = count % this.gridCells
        let repetition = Math.floor(count / this.gridCells);
        let beatDivision = count % this.cellsPerBeat;
        let beat = Math.floor(count / this.beatsPerBar) % this.beatsPerBar;
        let bar = Math.floor(count / this.beatsPerBar) % this.bars;
        console.log(`Repetition: ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, gridCells; ${this.gridCells})`);

        for (let row of this.rows) {
            let locator: CellLocator = {
                row: row.config.gridIndex,
                notationLocator: { bar: bar, beat: beat, division: beatDivision }
            }
            this.audioManager.playHit(this.currentHit(locator));
        }
        this.currentCell = cell
    }

    nextHitType(row: GridRow, hitTypeKey: HitTypeKey | undefined): HitTypeKey | undefined {
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

    currentHit(locator: CellLocator): InstrumentHit {
        let row = this.rows[locator.row]
        let hitTypeKey = this.getCell(locator).hitType
        return {
            instrumentName: row.config.name,
            hitKey: hitTypeKey
        }
    }

    update(locator: CellLocator, newHitTypeKey: HitTypeKey | undefined) {
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
