import type { Grid, GridCellUi, GridUi, InstrumentId, InstrumentManager, InstrumentWithId, NotationSection, GridConfig, GridRowUi, GridId, GridUis, BeatIndicator } from "$lib"

export function mapGridUi(grids: Map<GridId, Grid>, instrumentManager: InstrumentManager): GridUis {
    let gridUis: GridUi[] = [...grids.values()].map((grid) =>
        mapRowsToGridUi(grid, instrumentManager)
    );
    let ui: GridUis = {
        grids: gridUis.sort((a, b) => a.index - b.index)
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
        index: grid.index,
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
                    division.hits.forEach((instrumentHit) => {
                        let instrument: InstrumentWithId | undefined = instruments.get(instrumentHit.instrumentId)
                        let hit = instrument?.hitTypes.get(instrumentHit.hitId)
                        if (hit) {
                            cellContent += hit.key
                        }
                    })
                    let row: GridCellUi = {
                        isBeat: divisionI == 0,
                        isFirstBeatOfBar: divisionI == 0 && beatI == 0,
                        content: cellContent,
                        locator: {
                            grid: grid.id,
                            row: rowI,
                            notationLocator: { bar: barI, beat: beatI, division: divisionI }
                        },
                        cellsOccupied: division.cellsOccupied
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

// Splits the grid UI into manageable 2 bar cell sections which stack vertically
function splitRowsIntoSections(rows: GridRowUi[], config: GridConfig, gridCols: number, currentlyPlayingColumn: number): NotationSection[] {
    const sections: NotationSection[] = [];
    let chunkSize = (gridCols / config.bars) * 2; // Start with 2 bars per section
    if (chunkSize > 32) {
        chunkSize = gridCols / config.bars // But downsize to 1 bar per section if > 32 cells
    }
    const numSections = Math.ceil(gridCols / chunkSize);

    for (let i = 0; i < numSections; i++) {
        let min = i * chunkSize // 0 
        let max = (i + 1) * chunkSize //16
        const sectionRows: GridRowUi[] = rows.map(row => {
            let gridRowUi = {
                ...row,
                gridCells: (row.gridCells.reduce((acc, cell, index, arr) => {
                    if (acc.cnt >= min && acc.cnt < max) {
                        acc.acc.push(cell)
                    }
                    acc.cnt += cell.cellsOccupied
                    return acc
                }, { cnt: 0, acc: [] as GridCellUi[] })).acc
            }
            return gridRowUi
        });

        let sectionColumns = sectionRows[0].gridCells.reduce((acc, cell) => acc + cell.cellsOccupied, 0)
        console.log(sectionColumns)
        const beatIndicator: BeatIndicator[] = Array.from({ length: sectionColumns }, (_, i) => {
            let text = "";
            let index = min + i

            const playing = index == currentlyPlayingColumn
            const divisionModulo = index % config.beatDivisions
            const isBeat = divisionModulo == 0
            const isFirstBeatOfBar = isBeat && index % (config.beatsPerBar * config.beatDivisions) == 0;
            const isAndBeatOfBar = divisionModulo == (config.beatDivisions * 0.5)
            const isEBeatOfBar = divisionModulo == (config.beatDivisions * 0.25)
            const isABeatOfBar = divisionModulo == (config.beatDivisions * 0.75)
            if (isBeat) {
                text = `${((index / config.beatDivisions) % config.beatsPerBar) + 1}`
            } else if (isAndBeatOfBar) {
                text = "&"
            } else if (isEBeatOfBar) {
                text = "e"
            } else if (isABeatOfBar) {
                text = "a"
            }
            const indicator: BeatIndicator = { isFirstBeatOfBar, isBeat, playing, text }
            return indicator
        })
        sections.push({
            sectionRows,
            columns: sectionColumns,
            beatIndicator
        });
    }

    return sections;
}
