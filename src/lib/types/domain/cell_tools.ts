import type { HitTypeWithId, InstrumentWithId } from "./instrument_domain"

export type CellTools = {
    instrument: InstrumentWithId, 
    hits: HitTypeWithId[]
    cellsOccupied: number
    isFirstCell: Boolean
    isLastCell: Boolean
}