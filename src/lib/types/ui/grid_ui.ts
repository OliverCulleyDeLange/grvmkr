import type { CellLocator, GridId } from "$lib";

// UI Models
export type NotationGridRowUi = {
    index: number,
    instrumentName: string
    gridCells: GridCellUi[]
};

export type GridCellUi = {
    darken: boolean
    content: string
    locator: CellLocator
}

// Grid UI Events
export type GridEvents = TogglePlaying | ToggleGridHit | RemoveGrid | BpmChanged | BarsChanged | GridSizeChanged

export enum GridEvent {
    TogglePlaying = "TogglePlaying",
    ToggleGridHit = "ToggleGridHit",
    RemoveGrid = "RemoveGrid",
    BpmChanged = "BpmChanged",
    BarsChanged = "BarsChanged",
    GridSizeChanged = "GridSizeChanged"
}

export type TogglePlaying = {
    event: GridEvent.TogglePlaying
    playing: boolean
    gridId: GridId
}
export type ToggleGridHit = {
    event: GridEvent.ToggleGridHit
    locator: CellLocator
}
export type RemoveGrid = {
    event: GridEvent.RemoveGrid
    gridId: GridId
}
export type BpmChanged = {
    event: GridEvent.BpmChanged
    gridId: GridId
    bpm: number
}
export type BarsChanged = {
    event: GridEvent.BarsChanged
    gridId: GridId
    bars: number
}
export type GridSizeChanged = {
    event: GridEvent.GridSizeChanged
    gridId: GridId
    beats_per_bar: number
    beat_divisions: number
}