import type { CellLocator } from "../domain/grid_domain"

export type ContextMenuEvents = MergeCells | UnMergeCells

export enum ContextMenuEvent {
    MergeCells = "MergeCells",
    UnMerge = "UnMerge"
}

export type MergeCells = {
    event: ContextMenuEvent.MergeCells
    side: 'left' | 'right'
    locator: CellLocator
}

export type UnMergeCells = {
    event: ContextMenuEvent.UnMerge
    locator: CellLocator
}

export type ContextMenuUi = {
    x: number
    y: number
    locator: CellLocator
    showMergeLeft: boolean
    showMergeRight: boolean
    showUnmerge: boolean
}  