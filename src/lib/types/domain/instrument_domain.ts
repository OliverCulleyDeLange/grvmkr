
export type InstrumentId = string
export type HitId = string
export type HitTypeKey = string | undefined

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