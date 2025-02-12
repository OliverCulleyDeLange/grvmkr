import type { CellTools, CellToolsUi, GridId, InstrumentHit } from "$lib";

export function mapCellToolsUi(
    cellTools: CellTools | undefined,
    gridId: GridId
): CellToolsUi {
    let options: Map<string, InstrumentHit[]> = new Map([[" ", []]])

    const ui: CellToolsUi = {
        show: false,
        hitOptions: options,
        showMergeRight: false,
        showMergeLeft: false,
        showUnMerge: false,
    }

    if (cellTools == undefined || cellTools.gridId != gridId) return ui

    ui.show = true
    cellTools?.hits.forEach((hit) => {
        const hitCount = getHitCountsForCellOccupation(cellTools.cellsOccupied)
        hitCount.forEach((count) => {
            const instrumentHit: InstrumentHit = {
                instrumentId: cellTools.instrument.id,
                hitId: hit.id
            }
            ui.hitOptions.set(hit.key.repeat(count), Array(count).fill(instrumentHit))
        })
    })
    ui.showMergeRight = !cellTools.isLastCell && cellTools.cellsOccupied < 8
    ui.showMergeLeft = !cellTools.isFirstCell  && cellTools.cellsOccupied < 8
    ui.showUnMerge = cellTools.cellsOccupied > 1
    return ui
}

// Eg, a single cell can have one hit only
// A merged cell (2 cells) can have either 1 or 3 hits
// A merged cell (3 cells) can have 2 or 4 hits etc
function getHitCountsForCellOccupation(cellsOccupied: number): number[] {
    switch (cellsOccupied) {
        case 1:
            return [1]
        case 2:
            return [1, 3]
        case 3:
            return [2, 4]
        case 4:
            return [1, 3, 5]
        case 5:
            return [2, 4, 6]
        case 6:
            return [1, 3, 5, 7]
        case 7:
            return [2, 4, 6, 7]
        case 8:
            return [1, 3, 5, 7, 9]
    }
    return [1]
}
