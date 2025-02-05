import type { InstrumentHit, InstrumentWithId } from "./instrument_domain";

export type GridRow = {
    instrument: InstrumentWithId
    notation: Notation
};

export type CellLocator = {
    row: number
    notationLocator: NotationLocator
};

export type NotationLocator = {
    bar: number
    beat: number
    division: number
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
