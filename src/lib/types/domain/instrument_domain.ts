
export type InstrumentId = string
export type HitId = string
export type HitTypeKey = string

// Uninitialised instrument config. 
export type InstrumentConfig = {
    hitTypes: Array<HitType>
    name: string
};

// InstrumentConfig creates these when they're initialised and given an ID
export type InstrumentWithId = {
    id: InstrumentId
    hitTypes: Map<HitId, HitTypeWithId>
    gridIndex: number
    name: string,
    volume: number,
    muted: boolean,
    soloed: boolean,
};

export type HitTypeWithId = HitType & { id: HitId }; 
export type HitType = {
    key: HitTypeKey
    description: string | undefined
    audioFileName: string,
    volume: number,
}