import type { InstrumentId } from "$lib"

// Grid UI Events
export type InstrumentEvents = RemoveInstrument | AddInstrument

export enum InstrumentEvent {
    RemoveInstrument = "RemoveInstrument",
    AddInstrument = "AddInstrument"
}

export type RemoveInstrument = {
    event: InstrumentEvent.RemoveInstrument
    instrumentId: InstrumentId
}
export type AddInstrument = {
    event: InstrumentEvent.AddInstrument
}