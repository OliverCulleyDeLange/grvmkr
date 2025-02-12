import type { ContextMenu, ContextMenuUi } from "$lib";

export function mapContextMenu(contextMenu: ContextMenu | undefined): ContextMenuUi | undefined {
    return contextMenu ? {
        x: contextMenu.x,
        y: contextMenu.y,
        locator: contextMenu.locator,
        showMergeLeft: !contextMenu.isFirstCell,
        showMergeRight: !contextMenu.isLastCell,
        showUnmerge: contextMenu.isMergedCell
    } : undefined
}