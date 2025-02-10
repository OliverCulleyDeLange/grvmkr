import type { ContextMenu, ContextMenuUi } from "$lib";

export function mapContextMenu(contextMenu: ContextMenu): ContextMenuUi {
    return {
        x: contextMenu.x,
        y: contextMenu.y,
        locator: contextMenu.locator,
        showMergeLeft: !contextMenu.isFirstCell,
        showMergeRight: !contextMenu.isLastCell,
    }
}