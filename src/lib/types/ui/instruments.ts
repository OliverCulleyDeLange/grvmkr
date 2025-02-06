import type { InstrumentId } from "$lib"

// Grid UI Events
export type InstrumentEvents = RemoveInstrument | AddInstrument | InstrumentsInitialised

export enum InstrumentEvent {
    RemoveInstrument = "RemoveInstrument",
    AddInstrument = "AddInstrument",
    InstrumentsInitialised = "InstrumentsInitialised"
}

export type RemoveInstrument = {
    event: InstrumentEvent.RemoveInstrument
    instrumentId: InstrumentId
}
export type AddInstrument = {
    event: InstrumentEvent.AddInstrument
}
export type InstrumentsInitialised = {
    event: InstrumentEvent.InstrumentsInitialised
}