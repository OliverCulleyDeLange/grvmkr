import type { CellLocator } from "../domain/grid_domain"

export type ContextMenuEvents = MergeCells

export enum ContextMenuEvent {
    MergeCells = "MergeCells"
}

export type MergeCells = {
    event: ContextMenuEvent.MergeCells
    side: 'left' | 'right'
    locator: CellLocator
}