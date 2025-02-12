import type { CellLocator } from "./grid_domain"

export type ContextMenu = {
    x: number
    y: number
    locator: CellLocator
    isFirstCell: boolean
    isLastCell: boolean
    isMergedCell: boolean
}