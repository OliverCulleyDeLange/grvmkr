import type { CellLocator, CellTools, Grid } from "$lib";
import { writable, type Writable } from "svelte/store";

export type CellToolsStore = {
    cellTools: Writable<CellTools | undefined>
    updateCellTools: (currentlySelectedCell: CellLocator | undefined, grid: Grid | undefined) => void
}

export const createCellToolsStore = (): CellToolsStore => {
    
    let cellTools: Writable<CellTools | undefined> = writable()

    function updateCellTools(
        currentlySelectedCell: CellLocator | undefined,
        grid: Grid | undefined
    ) {
        if (currentlySelectedCell) {
            const locator = currentlySelectedCell
            const instrument = grid?.rows[locator.row].instrument
            const currentCell = grid?.rows[locator.row]?.cells[locator.cell]
            const gridCols = grid?.gridCols
            const cellsOccupied = currentCell?.cells_occupied ?? 0
            if (instrument) {
                cellTools.set({
                    gridId: grid.id,
                    instrument: instrument,
                    hits: [...instrument?.hitTypes.values() ?? []],
                    cellsOccupied,
                    isFirstCell: locator.cell == 0,
                    isLastCell: gridCols ? locator.cell == gridCols - cellsOccupied : false,
                })
            } else {
                console.error("Can't display cell tools - instrument not found")
            }
        } else {
            cellTools.set(undefined)
        }
    }

    return { cellTools, updateCellTools };
};