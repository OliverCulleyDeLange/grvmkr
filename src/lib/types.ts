
export type InstrumentId = string

export type InstrumentConfig = {
    hitTypes: Array<HitType>
    gridIndex: number
    name: string
};

export type HitType = {
    key: HitTypeKey
    description: string | undefined
    audioPath: string
}

export type InstrumentHit = {
    instrumentName: string,
    hitKey: HitTypeKey
}

export type GridRow = {
    config: InstrumentConfig
    notation: Notation
    instrumentId: InstrumentId
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
    hitType: HitTypeKey
};


export type HitTypeKey = string | undefined