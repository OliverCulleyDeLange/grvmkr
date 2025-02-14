import type { ContextMenu, Grid, RightClick } from "$lib";

export class ContextMenuStore {
    public contextMenu: ContextMenu | undefined = $state()

    createContextMenu(event: RightClick, grid: Grid | undefined) {
        const locator = event.locator
        const cell = grid?.rows[locator.row].cells[locator.cell]
        let gridCols = grid?.gridCols
        console.error("old", $state.snapshot(this.contextMenu))
        this.contextMenu = {
            x: event.x,
            y: event.y,
            locator: locator,
            isFirstCell: locator.cell == 0,
            isLastCell: gridCols ? locator.cell == gridCols - 1 : false,
            isMergedCell: cell ? cell.cells_occupied > 1 : false
        }
        console.error("new", $state.snapshot(this.contextMenu))
    }

    clear = () => this.contextMenu = undefined
}