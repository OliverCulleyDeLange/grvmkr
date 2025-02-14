import type { ContextMenu, Grid, RightClick } from "$lib";
import { type Writable, writable } from "svelte/store";

export type ContextMenuStore = {
    contextMenu: Writable<ContextMenu | undefined>
    createContextMenu: (event: RightClick, grid: Grid | undefined) => void
    clear: () => void
}

export const createContextMenuStore = (): ContextMenuStore => {
    
    let contextMenu: Writable<ContextMenu | undefined> = writable()
    
    function createContextMenu(event: RightClick, grid: Grid | undefined) {
        const locator = event.locator;
        const cell = grid?.rows[locator.row].cells[locator.cell];
        let gridCols = grid?.gridCols;
    
        console.error("old", $state.snapshot(contextMenu));
        contextMenu.set({
            x: event.x,
            y: event.y,
            locator: locator,
            isFirstCell: locator.cell == 0,
            isLastCell: gridCols ? locator.cell == gridCols - 1 : false,
            isMergedCell: cell ? cell.cells_occupied > 1 : false
        });
    
        console.error("new", $state.snapshot(contextMenu));
    }
    

    const clear = () => contextMenu.set(undefined)

    return { contextMenu, createContextMenu, clear };
};