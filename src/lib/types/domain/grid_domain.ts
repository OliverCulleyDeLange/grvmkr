import type { HitId, InstrumentId, InstrumentWithId } from "./instrument_domain";

export type GridId = string

export type Grid = {
    id: GridId
    config: GridConfig
    rows: GridRow[]
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
    row: number
    notationLocator: NotationLocator
};

export type NotationLocator = {
    bar: number
    beat: number
    division: number
};