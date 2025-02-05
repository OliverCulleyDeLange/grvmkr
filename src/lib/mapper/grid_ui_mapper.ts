import type { Grid, GridCellUi, GridRow, InstrumentManager, InstrumentWithId, NotationGridRowUi } from "$lib"

export function mapRowsToGridUi(grid: Grid, instrumentManager: InstrumentManager): NotationGridRowUi[] {
    let instruments = instrumentManager.instruments
    let rows = grid.rows
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
                            grid: grid.id,
                            row: rowI,
                            notationLocator: { bar: barI, beat: beatI, division: divisionI }
                        }
                    }
                })
                return cells
            })
        })
        return {
            index: row.instrument.gridIndex,
            instrumentName: instruments.get(row.instrument.id)?.name ?? "error",
            gridCells
        }
    }).sort((a, b) => a.index - b.index)
    return ui
}