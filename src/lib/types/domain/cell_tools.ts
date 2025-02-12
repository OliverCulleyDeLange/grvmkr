import type { GridId } from "$lib"
import type { HitTypeWithId, InstrumentWithId } from "./instrument_domain"

export type CellTools = {
    gridId: GridId, 
    instrument: InstrumentWithId, 
    hits: HitTypeWithId[]
    cellsOccupied: number
    isFirstCell: Boolean
    isLastCell: Boolean
}