import type { HitId, InstrumentId, InstrumentWithId } from "./instrument_domain";

export type GridId = string

export type Grid = {
    id: GridId
    config: GridConfig
    rows: GridRow[]
    msPerBeatDivision: number,
    gridCols: number,
    playing: boolean
};

export type GridConfig = {
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
    hit: InstrumentHit | undefined
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