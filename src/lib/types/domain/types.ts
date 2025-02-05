
export type InstrumentId = string
export type HitId = string

// Uninitialised instrument config. 
export type InstrumentConfig = {
    hitTypes: Array<HitType>
    gridIndex: number
    name: string
};

// InstrumentConfig creates these when they're initialised and given an ID
export type InstrumentWithId = {
    id: InstrumentId
    hitTypes: Map<HitId, HitTypeWithId>
    gridIndex: number
    name: string
};

export type HitTypeWithId = HitType & { id: HitId }; 
export type HitType = {
    key: HitTypeKey
    description: string | undefined
    audioFileName: string
}

export type InstrumentHit = {
    instrumentId: InstrumentId,
    hitId: HitId
}

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


export type HitTypeKey = string | undefined