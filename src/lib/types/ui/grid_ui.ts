import type { CellLocator, CellToolsUi, GridConfig, GridId, VolumeControlUi } from "$lib";

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
    cellTools: CellToolsUi
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
    instrumentId: string,
    instrumentName: string,
    gridCells: GridCellUi[],
    volume: VolumeControlUi,
};

export type GridCellUi = {
    isBeat: boolean
    isFirstBeatOfBar: boolean
    content: string
    locator: CellLocator
    cellsOccupied: number
    cellDescription: string
    selected: boolean
}

// Grid UI Events
export type GridEvents = TogglePlaying | TappedGridCell | RemoveGrid | AddGrid | DuplicateGrid |
    BpmChanged | BarsChanged | GridSizeChanged | NameChanged | VolumeChanged | 
    RightClick | MuteInstrument | SoloInstrument

export enum GridEvent {
    TogglePlaying = "TogglePlaying",
    TappedGridCell = "TappedGridCell",
    RightClick = "RightClick",
    AddGrid = "AddGrid",
    DuplicateGrid = "DuplicateGrid",
    RemoveGrid = "RemoveGrid",
    BpmChanged = "BpmChanged",
    BarsChanged = "BarsChanged",
    GridSizeChanged = "GridSizeChanged",
    NameChanged = "NameChanged",
    VolumeChanged = "VolumeChanged",
    MuteInstrument = "MuteInstrument",
    SoloInstrument = "SoloInstrument",
}

export type TogglePlaying = {
    event: GridEvent.TogglePlaying
    playing: boolean
    gridId: GridId
}
export type TappedGridCell = {
    event: GridEvent.TappedGridCell
    locator: CellLocator
    shiftHeld: boolean
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
export type DuplicateGrid = {
    event: GridEvent.DuplicateGrid
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
// Contains either delta or volume
export type VolumeChanged = {
    event: GridEvent.VolumeChanged
    instrumentId: string,
    delta: number | undefined,
    volume: number | undefined,
}
export type MuteInstrument = {
    event: GridEvent.MuteInstrument
    instrumentId: string,
}
export type SoloInstrument = {
    event: GridEvent.SoloInstrument
    instrumentId: string,
}