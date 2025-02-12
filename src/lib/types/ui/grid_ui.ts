import type { CellLocator, GridConfig, GridId } from "$lib";

// UI Models
export type GridUis = {
    grids: GridUi[]
}
export type GridUi = {
    id: GridId
    index: number
    config: GridConfig
    // This represents how a grid is split vertically into sections to make long phrases easier to read
    notationSections: NotationSection[]
    msPerBeatDivision: number
    gridCols: number
    playing: boolean
    currentlyPlayingColumn: number
};

// This represents how a grid is split vertically into sections to make long phrases easier to read
export type NotationSection = {
    columns: number
    // A list of booleans indicating whether the column is currently playing
    beatIndicator: BeatIndicator[]
    sectionRows: GridRowUi[]
}

// The top row, indicating which beat is playing
export type BeatIndicator = {
    playing: boolean
    isBeat: boolean
    isFirstBeatOfBar: boolean
    text: string
}

export type GridRowUi = {
    index: number,
    instrumentName: string
    gridCells: GridCellUi[]
};

export type GridCellUi = {
    isBeat: boolean
    isFirstBeatOfBar: boolean
    content: string
    locator: CellLocator
    cellsOccupied: number
    cellDescription: string
}

// Grid UI Events
export type GridEvents = TogglePlaying | ToggleGridHit | RemoveGrid | AddGrid | 
    BpmChanged | BarsChanged | GridSizeChanged | NameChanged | RightClick

export enum GridEvent {
    TogglePlaying = "TogglePlaying",
    ToggleGridHit = "ToggleGridHit",
    RightClick = "RightClick",
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
export type RightClick = {
    event: GridEvent.RightClick
    x: number
    y: number
    locator: CellLocator
    gridId: GridId
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