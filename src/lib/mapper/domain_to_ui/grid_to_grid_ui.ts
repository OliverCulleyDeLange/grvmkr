import type { Grid, GridCellUi, GridUi, InstrumentId, InstrumentManager, InstrumentWithId, NotationSection, GridConfig, GridRowUi, GridId, GridUis, BeatIndicator } from "$lib"

export function mapGridUi(grids: Map<GridId, Grid>, instrumentManager: InstrumentManager): GridUis {
    let gridUis: GridUi[] = [...grids.values()].map((grid) =>
        mapRowsToGridUi(grid, instrumentManager)
    );
    let ui: GridUis = {
        grids: gridUis
    };
    return ui
}

export function mapRowsToGridUi(grid: Grid, instrumentManager: InstrumentManager): GridUi {
    let instruments = instrumentManager.instruments
    let rows = mapRows(grid, instruments)
    let sections = splitRowsIntoSections(rows, grid.config, grid.gridCols, grid.currentlyPlayingColumn)

    let ui: GridUi = {
        notationSections: sections,
        id: grid.id,
        config: grid.config,// Using a domain object for now- TODO replace with UI
        msPerBeatDivision: grid.msPerBeatDivision,
        gridCols: grid.gridCols,
        playing: grid.playing,
        currentlyPlayingColumn: grid.currentlyPlayingColumn
    }
    return ui
}

// Maps a domain grids rows into a list of GridRowUI 
function mapRows(grid: Grid, instruments: Map<InstrumentId, InstrumentWithId>): GridRowUi[] {
    return grid.rows.map((row, rowI) => {
        // Map each grid row into one or more UI rows
        // One grid row becomes multiple rows if it spans more than the threshold for being easy to read
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
                    let row: GridCellUi = {
                        darken: divisionI == 0,
                        content: cellContent,
                        locator: {
                            grid: grid.id,
                            row: rowI,
                            notationLocator: { bar: barI, beat: beatI, division: divisionI }
                        }
                    }
                    return row
                })
                return cells
            })
        })
        let notationGridRowUi: GridRowUi = {
            index: row.instrument.gridIndex,
            instrumentName: instruments.get(row.instrument.id)?.name ?? "error",
            gridCells
        }
        return notationGridRowUi
    }).sort((a, b) => a.index - b.index)
}

// Splits the grid UI into manageable 32 cell sections which stack vertically
function splitRowsIntoSections(rows: GridRowUi[], config: GridConfig, gridCols: number, currentlyPlayingColumn: number): NotationSection[] {
    const sections: NotationSection[] = [];
    const chunkSize = 32;
    const numSections = Math.ceil(gridCols / chunkSize);

    for (let i = 0; i < numSections; i++) {
        let min = i * chunkSize
        let max = (i + 1) * chunkSize
        const sectionRows: GridRowUi[] = rows.map(row => ({
            ...row,
            gridCells: row.gridCells.slice(min, max)
        }));

        let cols = sectionRows[0].gridCells.length
        const beatIndicator: BeatIndicator[] = Array.from({ length: cols }, (_, i) => {
            let index = min + i
            let darken = index % config.beatDivisions == 0
            const playing = index == currentlyPlayingColumn

            let text = "";
            const divisionModulo = index % config.beatDivisions
            const isFirstBeatOfBar = divisionModulo == 0
            const isAndBeatOfBar = divisionModulo == (config.beatDivisions * 0.5)
            const isEBeatOfBar = divisionModulo == (config.beatDivisions * 0.25)
            const isABeatOfBar = divisionModulo == (config.beatDivisions * 0.75)
            if (isFirstBeatOfBar) {
                text = `${((index / config.beatDivisions) % config.beatsPerBar) + 1}`
            } else if (isAndBeatOfBar) {
                text = "&"
            } else if (isEBeatOfBar) {
                text = "e"
            } else if (isABeatOfBar) {
                text = "a"
            }
            const indicator: BeatIndicator = { darken, playing, text }
            return indicator
        })
        sections.push({
            sectionRows,
            columns: cols,
            beatIndicator
        });
    }

    return sections;
}
