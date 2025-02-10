import type { HitId, InstrumentId, InstrumentWithId } from "./instrument_domain";

export type GridId = string

export type Grid = {
    id: GridId
    index: number,
    config: GridConfig
    rows: GridRow[]
    msPerBeatDivision: number,
    gridCols: number,
    playing: boolean,
    currentlyPlayingColumn: number
};

export type GridConfig = {
    name: string
    bpm: number
    bars: number
    beatsPerBar: number
    beatDivisions: number
};

export type GridRow = {
    instrument: InstrumentWithId
    notation: Notation
};

export type Notation = {
    bars: Array<Bar>
}

export type Bar = {
    beats: Array<Beat>
};

export type Beat = {
    divisions: Array<BeatDivision>
};

export type BeatDivision = {
    // gridIndex represents where in the Grid's beat the BeatDivision starts
    // If a 4 division beat contains two BeatDivisions, each occupying 2 cells,
    // The grid indexes would be 0 and 2
    gridIndex: number
    cellsOccupied: number
    hits: InstrumentHit[]
};

export type InstrumentHit = {
    instrumentId: InstrumentId,
    hitId: HitId
}

export type CellLocator = {
    grid: GridId
    row: number
    notationLocator: NotationLocator
};

export type NotationLocator = {
    bar: number
    beat: number
    division: number
};