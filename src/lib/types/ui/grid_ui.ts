import type { CellLocator, GridId } from "$lib";

// UI Models
export type GridUi = {
    // This represents how a grid is split vertically into sections to make long phrases easier to read
    notationSections: NotationSection[],
};

// This represents how a grid is split vertically into sections to make long phrases easier to read
export type NotationSection = {
    // Total number of columns in this section
    columns: number,
    // The cell numbers this section handles
    columnRange: number[],
    sectionRows: GridRowUi[]
}

export type GridRowUi = {
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
export type GridEvents = TogglePlaying | ToggleGridHit | RemoveGrid | AddGrid | 
    BpmChanged | BarsChanged | GridSizeChanged | NameChanged

export enum GridEvent {
    TogglePlaying = "TogglePlaying",
    ToggleGridHit = "ToggleGridHit",
    AddGrid = "AddGrid",
    RemoveGrid = "RemoveGrid",
    BpmChanged = "BpmChanged",
    BarsChanged = "BarsChanged",
    GridSizeChanged = "GridSizeChanged",
    NameChanged = "NameChanged",
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
export type AddGrid = {
    event: GridEvent.AddGrid
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
export type NameChanged = {
    event: GridEvent.NameChanged
    gridId: GridId
    name: string
}